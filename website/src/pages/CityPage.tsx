import { useParams, Link } from 'react-router-dom'
import { getCityByName, getMandatesForCity, findMayorByFullName, mayorKey } from '../data/loader'
import { formatDate, computeDuration } from '../utils/format'
import GenderBadge from '../components/GenderBadge'
import MandateTimeline from '../components/MandateTimeline'

export default function CityPage() {
  const { name } = useParams<{ name: string }>()
  const city = name ? getCityByName(decodeURIComponent(name)) : undefined

  if (!city) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Commune introuvable</h1>
        <Link to="/" className="text-blue-600 hover:underline">Retour à l'accueil</Link>
      </div>
    )
  }

  const mandates = getMandatesForCity(city.cityId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Accueil</Link>

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{city.name}</h1>
        <p className="text-gray-400 text-sm">Code INSEE : {city.cityId}</p>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">Chronologie des maires</h2>
      <div className="bg-gray-50 rounded-xl p-4 mb-8 overflow-x-auto">
        <MandateTimeline mandates={mandates} />
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {mandates.length} période{mandates.length > 1 ? 's' : ''} en fonction
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Maire</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Début</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Fin</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Durée</th>
            </tr>
          </thead>
          <tbody>
            {mandates.map((m, i) => {
              const mayor = findMayorByFullName(m.mayorName)
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {mayor && <GenderBadge gender={mayor.gender} />}
                      {mayor ? (
                        <Link
                          to={`/maire/${encodeURIComponent(mayorKey(mayor))}`}
                          className="text-blue-600 hover:underline"
                        >
                          {m.mayorName}
                        </Link>
                      ) : (
                        <span className="text-gray-800">{m.mayorName}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(m.startDate)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {m.endDate ? formatDate(m.endDate) : <span className="text-green-600 font-medium">En cours</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{computeDuration(m.startDate, m.endDate)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
