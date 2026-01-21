'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  gmailConnected: boolean
}

export default function SettingsClient({ gmailConnected }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function connectGmail() {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/gmail/connect')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Gmail connect error:', error)
      alert('Failed to connect Gmail')
    } finally {
      setLoading(false)
    }
  }

  async function disconnectGmail() {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/gmail/disconnect', { method: 'POST' })
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Gmail disconnect error:', error)
      alert('Failed to disconnect Gmail')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-gray-900">JobOps AI</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Gmail Integration */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Integration</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">Gmail</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Gmail to automatically track job applications
                    </p>
                    {gmailConnected && (
                      <p className="text-sm text-green-600 mt-1">✓ Connected</p>
                    )}
                  </div>
                  {gmailConnected ? (
                    <button
                      onClick={disconnectGmail}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectGmail}
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Connecting...' : 'Connect Gmail'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Data</h2>
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900">Read-only email access</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    JobOps AI only reads your emails to track job applications. We never send emails on your behalf.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">No auto-applications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    We never automatically apply to jobs. All applications are initiated by you.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Data deletion</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You can delete your account and all associated data at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Account */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
