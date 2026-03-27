import { useEffect } from 'react'
import OverviewTimeline from '../components/OverviewTimeline'

export default function FrisePage() {
  useEffect(() => {
    document.title = 'Frise chronologique — Maires de La Réunion'
    return () => { document.title = 'Maires de La Réunion' }
  }, [])

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Frise chronologique des maires
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        24 communes de La Réunion
      </p>
      <OverviewTimeline />
    </div>
  )
}
