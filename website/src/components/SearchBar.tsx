import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAll, type SearchResult } from '../data/loader'
import GenderBadge from './GenderBadge'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setSelectedIndex(-1)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const r = searchAll(value)
      setResults(r)
      setIsOpen(r.length > 0)
    }, 150)
  }

  function goTo(result: SearchResult) {
    setIsOpen(false)
    setQuery('')
    navigate(result.link)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      goTo(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const cityResults = results.filter(r => r.type === 'city')
  const mayorResults = results.filter(r => r.type === 'mayor')

  let globalIndex = -1

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Rechercher une commune ou un maire..."
        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {cityResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                Communes
              </div>
              {cityResults.map(r => {
                globalIndex++
                const idx = globalIndex
                return (
                  <button
                    key={r.link}
                    onClick={() => goTo(r)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                      selectedIndex === idx ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-blue-600">🏛</span>
                    <span className="text-gray-800">{r.label}</span>
                  </button>
                )
              })}
            </div>
          )}
          {mayorResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                Maires
              </div>
              {mayorResults.map(r => {
                globalIndex++
                const idx = globalIndex
                return (
                  <button
                    key={r.link}
                    onClick={() => goTo(r)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                      selectedIndex === idx ? 'bg-blue-50' : ''
                    }`}
                  >
                    <GenderBadge gender={r.gender!} />
                    <span className="text-gray-800">{r.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
