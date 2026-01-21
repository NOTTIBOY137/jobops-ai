import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createClient()
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
