import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <Dashboard />
}
