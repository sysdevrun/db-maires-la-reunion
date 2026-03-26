const files = [
  {
    name: 'cities.csv',
    description: 'Liste des 24 communes de La Réunion avec leur code INSEE',
  },
  {
    name: 'mayors.csv',
    description: 'Liste des maires : nom, prénom, date de naissance, genre',
  },
  {
    name: 'mayors_by_city.csv',
    description: 'Historique des périodes en fonction : commune, maire, dates de début et fin',
  },
]

export default function DownloadSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {files.map(f => (
        <a
          key={f.name}
          href={`/data/${f.name}`}
          download
          className="block bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-colors group"
        >
          <div className="font-mono text-sm text-blue-600 group-hover:text-blue-700 font-semibold">
            {f.name}
          </div>
          <div className="text-sm text-gray-500 mt-1">{f.description}</div>
        </a>
      ))}
    </div>
  )
}
