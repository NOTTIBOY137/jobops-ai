export type ApplicationStage = 
  | 'interested'
  | 'applied'
  | 'in_review'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'

export type EmailType = 
  | 'applied'
  | 'confirmation'
  | 'interview'
  | 'rejection'
  | 'assessment'
  | 'offer'
  | 'other'

export type EventType = 
  | 'followup'
  | 'interview'
  | 'assessment'
  | 'deadline'

export type IntegrationProvider = 
  | 'gmail'
  | 'outlook'
  | 'google_calendar'
  | 'outlook_calendar'

export type EventStatus = 
  | 'pending'
  | 'completed'
  | 'cancelled'

export interface Profile {
  id: string
  email: string
  name?: string
  degree?: string
  projects_text?: string
  skills_text?: string
  interests?: string
  coach_mode: boolean
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider: IntegrationProvider
  encrypted_token: string
  refresh_token?: string
  expires_at?: string
  label_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  job_url?: string
  location?: string
  source?: string
  stage: ApplicationStage
  applied_at?: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  user_id: string
  application_id?: string
  provider_id: string
  from_email?: string
  subject?: string
  snippet?: string
  body_text?: string
  received_at: string
  type?: EmailType
  raw_ref?: string
  created_at: string
}

export interface ResumeVersion {
  id: string
  application_id: string
  version_name: string
  docx_url?: string
  pdf_url?: string
  generated_text?: string
  keyword_gaps?: string[]
  is_locked: boolean
  created_at: string
}

export interface MasterResume {
  id: string
  user_id: string
  file_url: string
  file_name: string
  extracted_text?: string
  created_at: string
  updated_at: string
}

export interface InterviewPack {
  id: string
  application_id: string
  role_summary?: string
  tell_me_about_yourself?: string
  questions_json?: any
  behavioral_json?: any
  questions_to_ask?: any
  day_plan_30_60_90?: any
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  application_id?: string
  user_id: string
  event_type: EventType
  title: string
  description?: string
  due_at: string
  status: EventStatus
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  application_id: string
  user_id: string
  content: string
  is_llm_generated: boolean
  created_at: string
  updated_at: string
}
