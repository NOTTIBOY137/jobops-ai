'use client'

import { useState } from 'react'
import { Application, ApplicationStage } from '@/lib/types/database'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const stages: ApplicationStage[] = [
  'interested',
  'applied',
  'in_review',
  'screening',
  'interview',
  'offer',
  'rejected'
]

const stageLabels: Record<ApplicationStage, string> = {
  interested: 'Interested',
  applied: 'Applied',
  in_review: 'In Review',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected'
}

const stageColors: Record<ApplicationStage, string> = {
  interested: 'bg-gray-100 text-gray-800',
  applied: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  screening: 'bg-purple-100 text-purple-800',
  interview: 'bg-green-100 text-green-800',
  offer: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
}

interface PipelineBoardProps {
  applications: Application[]
  onUpdate: () => void
}

interface SortableItemProps {
  app: Application
}

function SortableItem({ app }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
        <a href={`/applications/${app.id}`} className="block">
          <h4 className="font-medium text-gray-900">{app.company}</h4>
          <p className="text-sm text-gray-600 mt-1">{app.role}</p>
          {app.location && (
            <p className="text-xs text-gray-500 mt-1">{app.location}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {new Date(app.last_activity_at).toLocaleDateString()}
          </p>
        </a>
      </div>
    </div>
  )
}

export default function PipelineBoard({ applications, onUpdate }: PipelineBoardProps) {
  const [apps, setApps] = useState(applications)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function getApplicationsForStage(stage: ApplicationStage): Application[] {
    return apps.filter(app => app.stage === stage)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Find the source and destination stages
    const sourceApp = apps.find(app => app.id === active.id)
    const destStage = over.id as ApplicationStage

    if (!sourceApp || sourceApp.stage === destStage) return

    // Update local state optimistically
    setApps(prev => prev.map(app => 
      app.id === active.id 
        ? { ...app, stage: destStage }
        : app
    ))

    // Update in database
    try {
      const response = await fetch(`/api/applications/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: destStage })
      })

      if (!response.ok) {
        // Revert on error
        setApps(applications)
        throw new Error('Failed to update application')
      }

      onUpdate()
    } catch (error) {
      console.error('Error updating application:', error)
      setApps(applications)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Pipeline</h2>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto p-6 space-x-4">
          {stages.map(stage => {
            const stageApps = getApplicationsForStage(stage)
            return (
              <div key={stage} className="flex-shrink-0 w-64">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    {stageLabels[stage]}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {stageApps.length} applications
                  </span>
                </div>
                
                <SortableContext
                  items={stageApps.map(app => app.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[200px]">
                    {stageApps.map((app) => (
                      <SortableItem key={app.id} app={app} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
