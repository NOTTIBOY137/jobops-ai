import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateInterviewPack } from '@/lib/interview-pack'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pack = await generateInterviewPack(user.id, params.id)

    return NextResponse.json(pack)
  } catch (error: any) {
    console.error('Interview pack generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
