import { Link } from 'react-router-dom'
import { cities, getMandatesForCity } from '../data/loader'

export default function CitiesPage() {
  const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Les 24 communes</h1>
      <p className="text-gray-500 mb-8">Communes de La Réunion et leurs maires</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(city => {
          const mandates = getMandatesForCity(city.cityId)
          const current = mandates.find(m => !m.endDate)
          return (
            <Link
              key={city.cityId}
              to={`/commune/${encodeURIComponent(city.name)}`}
              className="block p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-semibold text-gray-800">{city.name}</div>
              {current && (
                <div className="mt-2 text-sm text-gray-600">
                  Maire actuel : {current.mayorName}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-400">
                {new Set(mandates.map(m => m.mayorName)).size} maire{new Set(mandates.map(m => m.mayorName)).size > 1 ? 's' : ''} · {mandates.length} mandat{mandates.length > 1 ? 's' : ''}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
