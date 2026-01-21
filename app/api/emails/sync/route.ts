import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getDecryptedToken, getIntegration } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { 
  createGmailClient, 
  listJobRelatedEmails, 
  extractEmailContent, 
  detectEmailType, 
  extractApplicationData 
} from '@/lib/gmail'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get Gmail integration
    const integration = await getIntegration(user.id, 'gmail')
    if (!integration || !integration.is_active) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
    }
    
    // Get decrypted token
    const accessToken = await getDecryptedToken(user.id, 'gmail')
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get Gmail token' }, { status: 500 })
    }
    
    // Create Gmail client
    const gmailClient = createGmailClient(accessToken)
    
    // Fetch job-related emails
    const messages = await listJobRelatedEmails(gmailClient, 50)
    
    const supabase = createClient()
    const results = {
      created: 0,
      updated: 0,
      errors: 0
    }
    
    // Process each email
    for (const message of messages) {
      try {
        const { from, subject, body } = extractEmailContent(message)
        const { type, stage } = detectEmailType(subject, body)
        const appData = extractApplicationData(subject, body, from)
        
        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from('emails')
          .select('id, application_id')
          .eq('user_id', user.id)
          .eq('provider_id', message.id)
          .single()
        
        if (existingEmail) {
          // Email already processed, skip
          continue
        }
        
        // Find or create application
        let applicationId: string | null = null
        
        if (appData.company && appData.role) {
          // Try to find existing application
          const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .eq('company', appData.company)
            .eq('role', appData.role)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (existingApp) {
            applicationId = existingApp.id
            
            // Update application stage if email indicates a change
            if (stage) {
              await supabase
                .from('applications')
                .update({
                  stage: stage as any,
                  last_activity_at: new Date(message.internalDate).toISOString(),
                  source: appData.source || undefined,
                  job_url: appData.jobUrl || undefined
                })
                .eq('id', applicationId)
              
              results.updated++
            }
          } else {
            // Create new application
            const { data: newApp, error: appError } = await supabase
              .from('applications')
              .insert({
                user_id: user.id,
                company: appData.company,
                role: appData.role,
                source: appData.source,
                job_url: appData.jobUrl,
                stage: stage || 'applied',
                applied_at: type === 'confirmation' ? new Date(message.internalDate).toISOString() : undefined,
                last_activity_at: new Date(message.internalDate).toISOString()
              })
              .select()
              .single()
            
            if (appError) throw appError
            applicationId = newApp.id
            results.created++
          }
        }
        
        // Save email
        await supabase
          .from('emails')
          .insert({
            user_id: user.id,
            application_id: applicationId,
            provider_id: message.id,
            from_email: from,
            subject,
            snippet: message.snippet,
            body_text: body,
            received_at: new Date(parseInt(message.internalDate)).toISOString(),
            type: type as any
          })
        
        // Create events based on email type
        if (applicationId) {
          if (type === 'interview' && stage === 'interview') {
            // Create interview event
            await supabase
              .from('events')
              .insert({
                user_id: user.id,
                application_id: applicationId,
                event_type: 'interview',
                title: `Interview: ${appData.company} - ${appData.role}`,
                description: `Interview scheduled based on email: ${subject}`,
                due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
                status: 'pending'
              })
          } else if (type === 'assessment') {
            // Create assessment event
            await supabase
              .from('events')
              .insert({
                user_id: user.id,
                application_id: applicationId,
                event_type: 'assessment',
                title: `Assessment: ${appData.company} - ${appData.role}`,
                description: `Assessment required: ${subject}`,
                due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
              })
          } else if (stage === 'applied') {
            // Create follow-up reminder (5-7 days after applied)
            await supabase
              .from('events')
              .insert({
                user_id: user.id,
                application_id: applicationId,
                event_type: 'followup',
                title: `Follow-up: ${appData.company} - ${appData.role}`,
                description: 'Follow up on application status',
                due_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
                status: 'pending'
              })
          }
        }
        
        // Label email in Gmail (if label exists)
        if (integration.label_id) {
          try {
            await gmailClient.users.messages.modify({
              userId: 'me',
              id: message.id,
              requestBody: {
                addLabelIds: [integration.label_id]
              }
            })
          } catch (labelError) {
            // Labeling is not critical, continue
            console.warn('Failed to label email:', labelError)
          }
        }
      } catch (error: any) {
        console.error('Error processing email:', error)
        results.errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: messages.length,
      ...results
    })
  } catch (error: any) {
    console.error('Email sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
