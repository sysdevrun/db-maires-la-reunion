import { Link } from 'react-router-dom'
import { intercommunalites, getCitiesByInterco, getMandatesForCity, citySlug } from '../data/loader'

export default function CitiesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Les 24 communes</h1>
      <p className="text-gray-500 mb-8">Communes de La Réunion par intercommunalité</p>

      {intercommunalites.map(interco => {
        const cities = getCitiesByInterco(interco.shortName)
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

        return (
          <section key={interco.shortName} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">{interco.shortName}</h2>
            <p className="text-sm text-gray-400 mb-4">
              {interco.name} · {cities.length} commune{cities.length > 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map(city => {
                const mandates = getMandatesForCity(city.cityId)
                const current = mandates.find(m => !m.endDate)
                return (
                  <Link
                    key={city.cityId}
                    to={`/commune/${citySlug(city.name)}`}
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
          </section>
        )
      })}
    </div>
  )
}
