import { HashRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import MayorPage from './pages/MayorPage'
import CityPage from './pages/CityPage'
import DownloadPage from './pages/DownloadPage'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/maire/:name" element={<MayorPage />} />
            <Route path="/commune/:name" element={<CityPage />} />
            <Route path="/data" element={<DownloadPage />} />
          </Routes>
        </main>
        <footer className="text-center text-sm text-gray-400 py-6 border-t border-gray-100">
          Données sous licence CC0 1.0 Universal
        </footer>
      </div>
    </HashRouter>
  )
}

export default App
