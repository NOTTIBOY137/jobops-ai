import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createApplication } from '@/lib/applications'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { company, role, location, jobDescription, jobUrl, source } = await request.json()

    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role required' }, { status: 400 })
    }

    // Create application
    const application = await createApplication(user.id, {
      company,
      role,
      location,
      job_url: jobUrl,
      source,
      stage: 'interested'
    })

    // Optionally save job description as a note
    if (jobDescription) {
      const supabase = createClient()
      await supabase
        .from('notes')
        .insert({
          application_id: application.id,
          user_id: user.id,
          content: `Job Description:\n\n${jobDescription}`,
          is_llm_generated: false
        })
    }

    return NextResponse.json({ 
      success: true,
      application 
    })
  } catch (error: any) {
    console.error('Save from extension error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
