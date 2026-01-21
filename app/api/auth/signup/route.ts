import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrUpdateProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Sign up user (trigger will automatically create profile)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0] // Pass name in metadata for trigger
        }
      }
    })
    
    if (authError) throw authError
    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    // Update profile with name if provided (trigger creates it, but may not have name)
    if (name) {
      try {
        await createOrUpdateProfile(authData.user.id, email, { name })
      } catch (profileError) {
        // Profile might already exist from trigger, that's okay
        console.log('Profile update note:', profileError)
      }
    }
    
    return NextResponse.json({ 
      user: authData.user,
      message: 'Account created successfully'
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
