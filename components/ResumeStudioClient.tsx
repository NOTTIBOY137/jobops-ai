'use client'

import { useState } from 'react'
import { MasterResume } from '@/lib/types/database'

interface ResumeStudioClientProps {
  masterResume: MasterResume | null
}

export default function ResumeStudioClient({ masterResume: initialMasterResume }: ResumeStudioClientProps) {
  const [masterResume, setMasterResume] = useState(initialMasterResume)
  const [uploading, setUploading] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        setMasterResume(data)
        alert('Master resume uploaded successfully!')
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleTailor() {
    if (!jobDescription || !applicationId) {
      alert('Please provide job description and application ID')
      return
    }

    setTailoring(true)
    try {
      const response = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          jobDescription,
          company,
          role
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Resume tailored successfully! Missing keywords: ${data.keywordGaps.join(', ') || 'None'}`)
        setJobDescription('')
        setApplicationId('')
        setCompany('')
        setRole('')
      } else {
        throw new Error(data.error || 'Tailoring failed')
      }
    } catch (error: any) {
      alert(`Tailoring failed: ${error.message}`)
    } finally {
      setTailoring(false)
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
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Resume Studio</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload your master resume and generate tailored versions for each application
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Master Resume Upload */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Master Resume</h2>
              {masterResume ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{masterResume.file_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(masterResume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={masterResume.file_url}
                      target="_blank"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      View
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Master Resume'}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports PDF, DOC, DOCX, and TXT files
                  </p>
                </div>
              )}
            </div>

            {/* Tailor Resume */}
            {masterResume && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tailor Resume for Application</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application ID
                    </label>
                    <input
                      type="text"
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter application ID"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Job title"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Paste the full job description here..."
                    />
                  </div>
                  <button
                    onClick={handleTailor}
                    disabled={tailoring || !jobDescription || !applicationId}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {tailoring ? 'Generating...' : 'Generate Tailored Resume'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
