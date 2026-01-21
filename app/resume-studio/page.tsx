import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getMasterResume } from '@/lib/resume'
import ResumeStudioClient from '@/components/ResumeStudioClient'

export const dynamic = 'force-dynamic'

export default async function ResumeStudioPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const masterResume = await getMasterResume(user.id)

  return <ResumeStudioClient masterResume={masterResume} />
}
