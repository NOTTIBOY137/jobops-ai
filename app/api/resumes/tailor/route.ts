import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getMasterResume, parseJobDescription, tailorResumeWithLLM, generateResumeFiles, saveResumeVersion } from '@/lib/resume'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId, jobDescription, company, role } = await request.json()

    if (!applicationId || !jobDescription) {
      return NextResponse.json({ error: 'Application ID and job description required' }, { status: 400 })
    }

    // Get master resume
    const masterResume = await getMasterResume(user.id)
    if (!masterResume || !masterResume.extracted_text) {
      return NextResponse.json({ error: 'Master resume not found. Please upload one first.' }, { status: 400 })
    }

    // Tailor resume with LLM
    const { tailoredText, keywordGaps, notes } = await tailorResumeWithLLM(
      masterResume.extracted_text,
      jobDescription,
      company || 'Company',
      role || 'Role'
    )

    // Generate files
    const versionName = `Resume for ${company || 'Company'} - ${role || 'Role'}`
    const { docxBuffer, pdfBuffer } = await generateResumeFiles(tailoredText, versionName)

    // Save version
    const version = await saveResumeVersion(
      applicationId,
      versionName,
      tailoredText,
      keywordGaps,
      docxBuffer,
      pdfBuffer
    )

    return NextResponse.json({
      version,
      notes,
      keywordGaps
    })
  } catch (error: any) {
    console.error('Resume tailoring error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
