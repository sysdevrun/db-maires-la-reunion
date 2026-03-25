import { useParams, Link } from 'react-router-dom'
import { getMayorByKey, getMandatesForMayor, getCityById, mayorFullName } from '../data/loader'
import { formatDate, computeDuration } from '../utils/format'
import GenderBadge from '../components/GenderBadge'

export default function MayorPage() {
  const { name } = useParams<{ name: string }>()
  const mayor = name ? getMayorByKey(decodeURIComponent(name)) : undefined

  if (!mayor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Maire introuvable</h1>
        <Link to="/" className="text-blue-600 hover:underline">Retour à l'accueil</Link>
      </div>
    )
  }

  const mandates = getMandatesForMayor(mayor)
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Accueil</Link>

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GenderBadge gender={mayor.gender} />
          <h1 className="text-3xl font-bold text-gray-800">
            {mayorFullName(mayor)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
          {mayor.birthDate && (
            <span>
              Né{mayor.gender === 'F' ? 'e' : ''} le {formatDate(mayor.birthDate)}
            </span>
          )}
          <span>{mayor.gender === 'F' ? 'Femme' : 'Homme'}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {mandates.length} période{mandates.length > 1 ? 's' : ''} en fonction
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Commune</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Début</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Fin</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-500">Durée</th>
            </tr>
          </thead>
          <tbody>
            {mandates.map((m, i) => {
              const city = getCityById(m.cityId)
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {city ? (
                      <Link
                        to={`/commune/${encodeURIComponent(city.name)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {city.name}
                      </Link>
                    ) : m.cityId}
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
