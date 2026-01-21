import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getApplicationWithDetails } from '@/lib/applications'
import ApplicationDetail from '@/components/ApplicationDetail'

export const dynamic = 'force-dynamic'

export default async function ApplicationPage({
  params
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const data = await getApplicationWithDetails(user.id, params.id)

  return <ApplicationDetail data={data} />
}
