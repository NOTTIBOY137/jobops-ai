import { createClient } from './supabase/server'
import { getApplication } from './applications'
import { getMasterResume } from './resume'

export async function generateInterviewPack(
  userId: string,
  applicationId: string
): Promise<any> {
  const application = await getApplication(userId, applicationId)
  if (!application) {
    throw new Error('Application not found')
  }

  // Get master resume for context
  const masterResume = await getMasterResume(userId)
  const resumeText = masterResume?.extracted_text || ''

  // Get job description if available
  let jobDescription = ''
  if (application.job_url) {
    // In production, fetch and parse the job description from URL
    // For MVP, we'll use what we have
    jobDescription = `Role: ${application.role}\nCompany: ${application.company}`
  }

  // Generate interview pack using LLM
  const openai = require('openai')
  const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const prompt = `You are a friendly career coach helping a fresh graduate prepare for an interview.

Application Details:
- Company: ${application.company}
- Role: ${application.role}
- Location: ${application.location || 'Not specified'}

Job Description:
${jobDescription}

Candidate Resume Summary:
${resumeText.substring(0, 2000)}

Generate a comprehensive interview preparation pack. Return a JSON object with:

1. "role_summary": A 2-3 sentence summary of what this role likely entails
2. "tell_me_about_yourself": A personalized "Tell me about yourself" answer (2-3 paragraphs) that aligns with the resume and role
3. "questions": Array of 10 likely interview questions for this role, each with:
   - "question": The question text
   - "answer_framework": A brief framework/guidance for answering (not a full answer, just structure)
4. "behavioral": Array of 5 behavioral questions using STAR method, each with:
   - "prompt": The question
   - "star_guidance": Guidance on how to structure the answer using STAR (Situation, Task, Action, Result)
5. "questions_to_ask": Array of 5 smart, specific questions the candidate should ask the interviewer
6. "day_plan_30_60_90": Optional object with "30", "60", "90" day plans (brief bullet points for each)

Be encouraging, practical, and specific to this role. Do NOT invent experience that isn't in the resume.

Return ONLY valid JSON, no markdown formatting.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful career coach. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const content = response.choices[0].message.content
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const packData = JSON.parse(jsonContent)

    // Save to database
    const supabase = createClient()
    const { data, error } = await supabase
      .from('interview_packs')
      .upsert({
        application_id: applicationId,
        role_summary: packData.role_summary,
        tell_me_about_yourself: packData.tell_me_about_yourself,
        questions_json: packData.questions || [],
        behavioral_json: packData.behavioral || [],
        questions_to_ask: packData.questions_to_ask || [],
        day_plan_30_60_90: packData.day_plan_30_60_90 || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'application_id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Interview pack generation error:', error)
    throw error
  }
}

export async function getInterviewPack(applicationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interview_packs')
    .select('*')
    .eq('application_id', applicationId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}
