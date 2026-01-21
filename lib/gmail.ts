import { google } from 'googleapis'

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: {
      data?: string
    }
    parts?: Array<{
      mimeType: string
      body: { data?: string }
    }>
  }
  internalDate: string
}

export function createGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function createJobOpsLabel(gmailClient: any, userId: string): Promise<string> {
  try {
    // Check if label already exists
    const { data: labels } = await gmailClient.users.labels.list({ userId: 'me' })
    const existingLabel = labels.labels?.find((l: any) => l.name === 'JobOps')
    
    if (existingLabel) {
      return existingLabel.id
    }
    
    // Create new label
    const { data: label } = await gmailClient.users.labels.create({
      userId: 'me',
      requestBody: {
        name: 'JobOps',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    })
    
    return label.id
  } catch (error) {
    console.error('Error creating JobOps label:', error)
    throw error
  }
}

export async function listJobRelatedEmails(
  gmailClient: any,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  // Search for job-related emails
  const query = [
    'from:(noreply@greenhouse.io OR noreply@lever.co OR noreply@workday.com OR noreply@ashbyhq.com OR noreply@smartrecruiters.com OR noreply@icims.com OR noreply@taleo.net OR noreply@jobvite.com OR noreply@bamboohr.com)',
    'OR subject:("thank you for applying" OR "application received" OR "interview" OR "assessment" OR "rejection" OR "not moving forward" OR "under review" OR "in review" OR "phone screen" OR "offer")'
  ].join(' ')
  
  const { data } = await gmailClient.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  })
  
  if (!data.messages) return []
  
  // Fetch full message details
  const messages = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      const { data: message } = await gmailClient.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      })
      return message
    })
  )
  
  return messages
}

export function extractEmailContent(message: GmailMessage): {
  from: string
  subject: string
  body: string
} {
  const headers = message.payload.headers || []
  const from = headers.find(h => h.name === 'From')?.value || ''
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  
  let body = ''
  
  // Extract body text
  if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  } else if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        break
      }
    }
  }
  
  return { from, subject, body }
}

export function detectEmailType(subject: string, body: string): {
  type: 'applied' | 'confirmation' | 'interview' | 'rejection' | 'assessment' | 'offer' | 'other'
  stage?: 'applied' | 'in_review' | 'screening' | 'interview' | 'rejected'
} {
  const text = `${subject} ${body}`.toLowerCase()
  
  if (text.includes('thank you for applying') || text.includes('application received') || text.includes('application confirmation')) {
    return { type: 'confirmation', stage: 'applied' }
  }
  
  if (text.includes('under review') || text.includes('in review') || text.includes('reviewing your application')) {
    return { type: 'other', stage: 'in_review' }
  }
  
  if (text.includes('phone screen') || text.includes('phone interview') || text.includes('screening')) {
    return { type: 'interview', stage: 'screening' }
  }
  
  if (text.includes('interview') || text.includes('interview invitation')) {
    return { type: 'interview', stage: 'interview' }
  }
  
  if (text.includes('assessment') || text.includes('coding challenge') || text.includes('take-home')) {
    return { type: 'assessment' }
  }
  
  if (text.includes('offer') || text.includes('congratulations') || text.includes('we are pleased')) {
    return { type: 'offer', stage: 'offer' }
  }
  
  if (text.includes('not moving forward') || text.includes('rejection') || text.includes('unfortunately') || text.includes('we decided to move forward')) {
    return { type: 'rejection', stage: 'rejected' }
  }
  
  return { type: 'other' }
}

export function extractApplicationData(subject: string, body: string, from: string): {
  company?: string
  role?: string
  source?: string
  jobUrl?: string
} {
  const text = `${subject} ${body}`.toLowerCase()
  const result: any = {}
  
  // Detect ATS source
  if (from.includes('greenhouse.io')) result.source = 'Greenhouse'
  else if (from.includes('lever.co')) result.source = 'Lever'
  else if (from.includes('workday.com')) result.source = 'Workday'
  else if (from.includes('ashbyhq.com')) result.source = 'Ashby'
  else if (from.includes('smartrecruiters.com')) result.source = 'SmartRecruiters'
  else if (from.includes('icims.com')) result.source = 'iCIMS'
  else if (from.includes('taleo.net')) result.source = 'Taleo'
  else if (from.includes('jobvite.com')) result.source = 'Jobvite'
  else if (from.includes('bamboohr.com')) result.source = 'BambooHR'
  
  // Try to extract company name from email domain or body
  const companyMatch = body.match(/(?:at|for|with)\s+([A-Z][a-zA-Z\s&]+)/i) || 
                       subject.match(/(?:at|for|with)\s+([A-Z][a-zA-Z\s&]+)/i)
  if (companyMatch) {
    result.company = companyMatch[1].trim()
  }
  
  // Try to extract role title
  const roleMatch = body.match(/(?:position|role|job|opening)[:\s]+([A-Z][a-zA-Z\s]+)/i) ||
                    subject.match(/(?:position|role|job)[:\s]+([A-Z][a-zA-Z\s]+)/i)
  if (roleMatch) {
    result.role = roleMatch[1].trim()
  }
  
  // Extract job URL
  const urlMatch = body.match(/https?:\/\/[^\s]+(?:greenhouse|lever|workday|ashby|smartrecruiters|icims|taleo|jobvite|bamboohr)[^\s]+/i)
  if (urlMatch) {
    result.jobUrl = urlMatch[0]
  }
  
  return result
}
