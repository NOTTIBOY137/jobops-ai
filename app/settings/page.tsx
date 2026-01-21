import { redirect } from 'next/navigation'
import { getCurrentUser, getIntegration } from '@/lib/auth'
import SettingsClient from '@/components/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const gmailIntegration = await getIntegration(user.id, 'gmail')

  return <SettingsClient gmailConnected={!!gmailIntegration} />
}
