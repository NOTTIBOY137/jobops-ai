import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadMasterResume } from '@/lib/resume'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const resume = await uploadMasterResume(user.id, file)

    return NextResponse.json(resume)
  } catch (error: any) {
    console.error('Resume upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
