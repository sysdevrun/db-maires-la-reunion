import SearchBar from '../components/SearchBar'
import Stats from '../components/Stats'
import DownloadSection from '../components/DownloadSection'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <section className="py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          Maires de La Réunion
        </h1>
        <p className="text-gray-500 mb-8">
          Recherchez parmi les 24 communes et leurs maires depuis 1867
        </p>
        <SearchBar />
      </section>

      <section className="pb-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">En chiffres</h2>
        <Stats />
      </section>

      <section className="pb-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Télécharger les données</h2>
        <DownloadSection />
      </section>
    </div>
  )
}
