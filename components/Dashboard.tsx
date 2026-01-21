'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Application } from '@/lib/types/database'
import PipelineBoard from './PipelineBoard'
import { format } from 'date-fns'

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    interviews: 0,
    followUps: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Load applications
    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('last_activity_at', { ascending: false })

    if (apps) {
      setApplications(apps as Application[])
      
      // Calculate stats
      const active = apps.filter(a => 
        !['rejected', 'offer'].includes(a.stage)
      ).length
      
      const interviews = apps.filter(a => 
        ['interview', 'screening'].includes(a.stage)
      ).length
      
      // Load follow-up events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(10)
      
      setStats({
        active,
        interviews,
        followUps: events?.length || 0
      })
    }
    
    setLoading(false)
  }

  async function syncEmails() {
    try {
      const response = await fetch('/api/emails/sync', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert(`Synced ${data.processed} emails. Created: ${data.created}, Updated: ${data.updated}`)
        loadData()
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync emails')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">JobOps AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={syncEmails}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Sync Emails
              </button>
              <a
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Applications</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Interviews This Week</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.interviews}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Follow-ups Due</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.followUps}</p>
          </div>
        </div>

        {/* Pipeline Board */}
        <PipelineBoard applications={applications} onUpdate={loadData} />
      </main>
    </div>
  )
}
