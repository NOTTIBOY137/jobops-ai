import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export async function uploadMasterResume(userId: string, file: File) {
  const supabase = createClient()
  
  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/master-resume.${fileExt}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    })
  
  if (uploadError) throw uploadError
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName)
  
  // Extract text from resume
  // Note: Full text extraction would require server-side processing
  // For now, we'll store the file and extract text in the API route
  let extractedText = ''
  if (file.type === 'text/plain') {
    extractedText = await file.text()
  }
  
  // Save to database
  const { data, error } = await supabase
    .from('master_resumes')
    .upsert({
      user_id: userId,
      file_url: publicUrl,
      file_name: file.name,
      extracted_text: extractedText,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getMasterResume(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('master_resumes')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function parseJobDescription(jdText: string): Promise<{
  skills: string[]
  requirements: string[]
  responsibilities: string[]
  summary: string
}> {
  // Simple extraction - in production, use LLM for better parsing
  const skills: string[] = []
  const requirements: string[] = []
  const responsibilities: string[] = []
  
  // Extract common skills
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL',
    'Git', 'CI/CD', 'Agile', 'Scrum'
  ]
  
  skillKeywords.forEach(skill => {
    if (jdText.toLowerCase().includes(skill.toLowerCase())) {
      skills.push(skill)
    }
  })
  
  return {
    skills,
    requirements: requirements,
    responsibilities: responsibilities,
    summary: jdText.substring(0, 500) // First 500 chars as summary
  }
}

export async function tailorResumeWithLLM(
  masterResumeText: string,
  jobDescription: string,
  company: string,
  role: string
): Promise<{
  tailoredText: string
  keywordGaps: string[]
  notes: string
}> {
  const openai = require('openai')
  const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  const prompt = `You are helping tailor a resume for a job application.

Master Resume:
${masterResumeText}

Job Description:
${jobDescription}

Company: ${company}
Role: ${role}

Rules:
- Do NOT invent experience or skills that don't exist in the master resume
- Rephrase and reorder existing content to emphasize relevance
- Highlight projects and skills that match the job description
- Flag missing keywords that the user should consider adding (but don't fake them)

Output a JSON object with:
1. "tailored_text": The tailored resume content (keep it similar length to original)
2. "keyword_gaps": Array of important keywords from JD that are missing from resume
3. "notes": Brief explanation of changes made and why

Only return valid JSON, no markdown formatting.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful resume tailoring assistant. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
    
    const content = response.choices[0].message.content
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonContent)
    
    return {
      tailoredText: result.tailored_text || masterResumeText,
      keywordGaps: result.keyword_gaps || [],
      notes: result.notes || ''
    }
  } catch (error) {
    console.error('LLM tailoring error:', error)
    // Fallback to original resume
    return {
      tailoredText: masterResumeText,
      keywordGaps: [],
      notes: 'Error generating tailored version. Using master resume.'
    }
  }
}

export async function generateResumeFiles(
  tailoredText: string,
  fileName: string
): Promise<{ docxBuffer: Buffer; pdfBuffer: Buffer }> {
  // Note: File generation should be done in API route with proper libraries
  // This is a placeholder - actual implementation requires server-side libraries
  // For MVP, we'll create simple text-based files
  
  const docxBuffer = Buffer.from(tailoredText)
  const pdfBuffer = Buffer.from(tailoredText)
  
  return { docxBuffer, pdfBuffer }
}

export async function saveResumeVersion(
  applicationId: string,
  versionName: string,
  tailoredText: string,
  keywordGaps: string[],
  docxBuffer: Buffer,
  pdfBuffer: Buffer
) {
  const supabase = createClient()
  
  // Upload files
  const docxFileName = `${applicationId}/resume-${Date.now()}.docx`
  const pdfFileName = `${applicationId}/resume-${Date.now()}.pdf`
  
  const { data: docxUpload, error: docxError } = await supabase.storage
    .from('resumes')
    .upload(docxFileName, docxBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
  
  if (docxError) throw docxError
  
  const { data: pdfUpload, error: pdfError } = await supabase.storage
    .from('resumes')
    .upload(pdfFileName, pdfBuffer, {
      contentType: 'application/pdf'
    })
  
  if (pdfError) throw pdfError
  
  // Get public URLs
  const { data: { publicUrl: docxUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(docxFileName)
  
  const { data: { publicUrl: pdfUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(pdfFileName)
  
  // Save to database
  const { data, error } = await supabase
    .from('resume_versions')
    .insert({
      application_id: applicationId,
      version_name: versionName,
      docx_url: docxUrl,
      pdf_url: pdfUrl,
      generated_text: tailoredText,
      keyword_gaps: keywordGaps
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}
