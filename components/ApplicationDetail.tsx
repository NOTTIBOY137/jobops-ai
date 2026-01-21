'use client'

import { useState } from 'react'
import { Application, Email, ResumeVersion, InterviewPack, Event, Note } from '@/lib/types/database'
import { format } from 'date-fns'

interface ApplicationDetailProps {
  data: {
    application: Application
    emails: Email[]
    resumeVersions: ResumeVersion[]
    interviewPack: InterviewPack | null
    events: Event[]
    notes: Note[]
  }
}

export default function ApplicationDetail({ data }: ApplicationDetailProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'resume' | 'interview' | 'notes'>('timeline')

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.application.company}</h1>
              <p className="text-lg text-gray-600 mt-1">{data.application.role}</p>
              {data.application.location && (
                <p className="text-sm text-gray-500 mt-1">{data.application.location}</p>
              )}
              {data.application.job_url && (
                <a
                  href={data.application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                >
                  View Job Posting →
                </a>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                data.application.stage === 'rejected' ? 'bg-red-100 text-red-800' :
                data.application.stage === 'offer' ? 'bg-emerald-100 text-emerald-800' :
                data.application.stage === 'interview' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {data.application.stage.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'timeline', label: 'Timeline' },
                { id: 'resume', label: `Resume Versions (${data.resumeVersions.length})` },
                { id: 'interview', label: 'Interview Pack' },
                { id: 'notes', label: 'Notes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {data.emails.map(email => (
                  <div key={email.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{email.subject || 'No subject'}</p>
                        <p className="text-sm text-gray-600 mt-1">{email.from_email}</p>
                        {email.snippet && (
                          <p className="text-sm text-gray-500 mt-2">{email.snippet}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(email.received_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
                {data.events.map(event => (
                  <div key={event.id} className="border-l-2 border-primary-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        Due: {format(new Date(event.due_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'resume' && (
              <div className="space-y-4">
                {data.resumeVersions.length === 0 ? (
                  <p className="text-gray-500">No resume versions yet. Create one from the Resume Studio.</p>
                ) : (
                  data.resumeVersions.map(version => (
                    <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{version.version_name}</h4>
                          {version.keyword_gaps && version.keyword_gaps.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Missing keywords: {version.keyword_gaps.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {version.pdf_url && (
                            <a
                              href={version.pdf_url}
                              target="_blank"
                              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                            >
                              Download PDF
                            </a>
                          )}
                          {version.docx_url && (
                            <a
                              href={version.docx_url}
                              target="_blank"
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              Download DOCX
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'interview' && (
              <div>
                {!data.interviewPack ? (
                  <p className="text-gray-500">Interview pack will be generated when stage changes to Interview.</p>
                ) : (
                  <div className="space-y-6">
                    {data.interviewPack.role_summary && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Role Summary</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{data.interviewPack.role_summary}</p>
                      </div>
                    )}
                    {data.interviewPack.tell_me_about_yourself && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Tell Me About Yourself</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{data.interviewPack.tell_me_about_yourself}</p>
                      </div>
                    )}
                    {data.interviewPack.questions_json && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Role-Specific Questions</h3>
                        <div className="space-y-4">
                          {Array.isArray(data.interviewPack.questions_json) && data.interviewPack.questions_json.map((q: any, i: number) => (
                            <div key={i} className="border-l-2 border-primary-500 pl-4">
                              <p className="font-medium text-gray-900">{q.question}</p>
                              {q.answer_framework && (
                                <p className="text-sm text-gray-600 mt-1">{q.answer_framework}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.interviewPack.behavioral_json && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Behavioral Questions (STAR)</h3>
                        <div className="space-y-4">
                          {Array.isArray(data.interviewPack.behavioral_json) && data.interviewPack.behavioral_json.map((q: any, i: number) => (
                            <div key={i} className="border-l-2 border-purple-500 pl-4">
                              <p className="font-medium text-gray-900">{q.prompt}</p>
                              {q.star_guidance && (
                                <p className="text-sm text-gray-600 mt-1">{q.star_guidance}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.interviewPack.questions_to_ask && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Questions to Ask Interviewer</h3>
                        <ul className="list-disc list-inside space-y-2">
                          {Array.isArray(data.interviewPack.questions_to_ask) && data.interviewPack.questions_to_ask.map((q: any, i: number) => (
                            <li key={i} className="text-gray-700">{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {data.notes.map(note => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(note.created_at), 'MMM d, yyyy')}
                      {note.is_llm_generated && ' • AI Generated'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
