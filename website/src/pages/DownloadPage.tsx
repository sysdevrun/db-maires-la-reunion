import DownloadSection from '../components/DownloadSection'

export default function DownloadPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-8">Télécharger les données</h1>

      <DownloadSection />

      <section className="mt-12 bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Licence</h2>
        <p className="text-gray-600 mb-4">
          Ces données sont publiées sous licence{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            CC0 1.0 Universal
          </a>
          . Vous pouvez les utiliser librement, sans restriction, y compris à des fins commerciales.
        </p>

        <h2 className="text-xl font-semibold text-gray-700 mb-3">Contribuer</h2>
        <p className="text-gray-600">
          Les contributions sont les bienvenues sur le{' '}
          <a
            href="https://github.com/sysdevrun/db-maires-la-reunion"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            dépôt GitHub
          </a>
          . Vous pouvez également signaler une erreur en contactant{' '}
          <strong>Théophile Helleboid</strong> à l'adresse{' '}
          <a
            href="mailto:contact@sys-dev-run.fr"
            className="text-blue-600 hover:underline"
          >
            contact@sys-dev-run.fr
          </a>
          .
        </p>
      </section>
    </div>
  )
}
