import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'

export default function Header() {
  return (
    <header className="bg-blue-600 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Link to="/" className="text-lg font-semibold hover:text-blue-100 transition-colors shrink-0">
          Maires de La Réunion
        </Link>
        <div className="hidden lg:block flex-1 max-w-xs">
          <SearchBar variant="header" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-sm shrink-0">
          <Link to="/frise" className="hover:text-blue-100 transition-colors">
            Frise
          </Link>
          <Link to="/communes" className="hover:text-blue-100 transition-colors">
            Communes
          </Link>
          <Link to="/data" className="hover:text-blue-100 transition-colors">
            Télécharger
          </Link>
          <a
            href="https://gitlab.com/sysdevrun/maires-la-reunion"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-200 hover:text-white transition-colors"
            title="Voir sur GitLab"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
            </svg>
          </a>
          <a
            href="https://www.sys-dev-run.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-200 hover:text-white transition-colors text-xs sm:text-sm"
          >
            Conçu par SysDevRun
          </a>
        </div>
      </div>
    </header>
  )
}
