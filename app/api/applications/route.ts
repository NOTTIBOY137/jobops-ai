import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createApplication, getApplications } from '@/lib/applications'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await getApplications(user.id)
    return NextResponse.json(applications)
  } catch (error: any) {
    console.error('Get applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const application = await createApplication(user.id, body)

    return NextResponse.json(application)
  } catch (error: any) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
