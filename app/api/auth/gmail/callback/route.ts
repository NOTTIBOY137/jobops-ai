import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, saveIntegration, createOrUpdateProfile } from '@/lib/auth'
import { google } from 'googleapis'
import { createGmailClient, createJobOpsLabel } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    if (!code || state !== user.id) {
      return NextResponse.redirect(new URL('/settings?error=invalid_callback', request.url))
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    )
    
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      throw new Error('No access token received')
    }
    
    // Create Gmail client and set up label
    const gmailClient = createGmailClient(tokens.access_token)
    const labelId = await createJobOpsLabel(gmailClient, 'me')
    
    // Save integration
    await saveIntegration(
      user.id,
      'gmail',
      tokens.access_token,
      tokens.refresh_token || undefined,
      tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      labelId
    )
    
    // Update user profile if needed
    if (!user.email) {
      await createOrUpdateProfile(user.id, user.email || '', {})
    }
    
    return NextResponse.redirect(new URL('/settings?success=gmail_connected', request.url))
  } catch (error: any) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=gmail_connection_failed', request.url))
  }
}
