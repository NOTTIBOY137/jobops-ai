import { createClient } from './supabase/server'
import { Application, ApplicationStage } from './types/database'

export async function getApplications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('last_activity_at', { ascending: false })
  
  if (error) throw error
  return data as Application[]
}

export async function getApplication(userId: string, applicationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data as Application
}

export async function createApplication(userId: string, data: {
  company: string
  role: string
  job_url?: string
  location?: string
  source?: string
  stage?: ApplicationStage
}) {
  const supabase = createClient()
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      ...data,
      stage: data.stage || 'interested',
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return application as Application
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  updates: Partial<Application>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) throw error
  
  // If stage changed to interview, trigger interview pack generation
  if (updates.stage === 'interview') {
    try {
      const { generateInterviewPack } = await import('./interview-pack')
      await generateInterviewPack(userId, applicationId)
    } catch (error) {
      // Don't fail the update if pack generation fails
      console.error('Failed to generate interview pack:', error)
    }
  }
  
  return data as Application
}

export async function deleteApplication(userId: string, applicationId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('user_id', userId)
  
  if (error) throw error
}

export async function getApplicationWithDetails(userId: string, applicationId: string) {
  const supabase = createClient()
  
  // Get application
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single()
  
  if (appError) throw appError
  
  // Get related emails
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('application_id', applicationId)
    .order('received_at', { ascending: false })
  
  // Get resume versions
  const { data: resumeVersions } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  
  // Get interview pack
  const { data: interviewPack } = await supabase
    .from('interview_packs')
    .select('*')
    .eq('application_id', applicationId)
    .single()
  
  // Get events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('application_id', applicationId)
    .order('due_at', { ascending: true })
  
  // Get notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  
  return {
    application: application as Application,
    emails: emails || [],
    resumeVersions: resumeVersions || [],
    interviewPack: interviewPack || null,
    events: events || [],
    notes: notes || []
  }
}
