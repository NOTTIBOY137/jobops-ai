import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { updateApplication, deleteApplication } from '@/lib/applications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const application = await updateApplication(user.id, params.id, body)

    return NextResponse.json(application)
  } catch (error: any) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteApplication(user.id, params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete application error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
