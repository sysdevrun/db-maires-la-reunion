import citiesRaw from '../../../data/cities.csv?raw'
import mayorsRaw from '../../../data/mayors.csv?raw'
import mandatesRaw from '../../../data/mayors_by_city.csv?raw'

export interface City {
  cityId: string
  name: string
}

export interface Mayor {
  lastName: string
  firstName: string
  birthDate: string | null
  gender: 'M' | 'F'
}

export interface Mandate {
  cityId: string
  mayorName: string
  startDate: string
  endDate: string | null
}

function parseCSV(raw: string): string[][] {
  const lines = raw.trim().replace(/\r/g, '').split('\n')
  return lines.map(line => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)
    return fields
  })
}

function loadCities(): City[] {
  const rows = parseCSV(citiesRaw)
  return rows.slice(1).map(([cityId, name]) => ({ cityId, name }))
}

function loadMayors(): Mayor[] {
  const rows = parseCSV(mayorsRaw)
  return rows.slice(1).map(([lastName, firstName, birthDate, gender]) => ({
    lastName,
    firstName,
    birthDate: birthDate || null,
    gender: gender as 'M' | 'F',
  }))
}

function loadMandates(): Mandate[] {
  const rows = parseCSV(mandatesRaw)
  return rows.slice(1).map(([cityId, mayorName, startDate, endDate]) => ({
    cityId,
    mayorName,
    startDate,
    endDate: endDate?.trim() || null,
  }))
}

export const cities = loadCities()
export const mayors = loadMayors()
export const mandates = loadMandates()

const cityByName = new Map(cities.map(c => [c.name, c]))
const cityById = new Map(cities.map(c => [c.cityId, c]))

export function getCityByName(name: string): City | undefined {
  return cityByName.get(name)
}

export function getCityById(id: string): City | undefined {
  return cityById.get(id)
}

export function getMayorByKey(key: string): Mayor | undefined {
  const sepIndex = key.indexOf('_')
  if (sepIndex < 0) return undefined
  const firstName = key.slice(0, sepIndex)
  const lastName = key.slice(sepIndex + 1)
  return mayors.find(m => m.firstName === firstName && m.lastName === lastName)
}

export function mayorKey(m: Mayor): string {
  return `${m.firstName}_${m.lastName}`
}

export function mayorFullName(m: Mayor): string {
  return `${m.firstName} ${m.lastName}`
}

export function getMandatesForCity(cityId: string): Mandate[] {
  return mandates.filter(m => m.cityId === cityId)
}

export function getMandatesForMayor(mayor: Mayor): Mandate[] {
  const fullName = `${mayor.firstName} ${mayor.lastName}`
  return mandates.filter(m => m.mayorName === fullName)
}

export function findMayorByFullName(fullName: string): Mayor | undefined {
  return mayors.find(m => `${m.firstName} ${m.lastName}` === fullName)
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export interface SearchResult {
  type: 'city' | 'mayor'
  label: string
  link: string
  gender?: 'M' | 'F'
}

export function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = normalize(query)

  const cityResults: SearchResult[] = cities
    .filter(c => normalize(c.name).includes(q))
    .map(c => ({
      type: 'city' as const,
      label: c.name,
      link: `/commune/${encodeURIComponent(c.name)}`,
    }))

  const mayorResults: SearchResult[] = mayors
    .filter(m => {
      const full = normalize(`${m.firstName} ${m.lastName}`)
      const reversed = normalize(`${m.lastName} ${m.firstName}`)
      return full.includes(q) || reversed.includes(q)
    })
    .map(m => ({
      type: 'mayor' as const,
      label: `${m.firstName} ${m.lastName}`,
      link: `/maire/${encodeURIComponent(mayorKey(m))}`,
      gender: m.gender,
    }))

  return [...cityResults, ...mayorResults].slice(0, 20)
}

export function computeStats() {
  const totalCities = cities.length
  const totalMayors = mayors.length
  const totalWomen = mayors.filter(m => m.gender === 'F').length

  const mandateDurations = new Map<string, number>()
  for (const m of mandates) {
    const start = new Date(m.startDate).getTime()
    const end = m.endDate ? new Date(m.endDate).getTime() : Date.now()
    const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000)
    mandateDurations.set(m.mayorName, (mandateDurations.get(m.mayorName) ?? 0) + years)
  }

  let longestMayor = ''
  let longestYears = 0
  for (const [name, years] of mandateDurations) {
    if (years > longestYears) {
      longestMayor = name
      longestYears = years
    }
  }

  const oldestMandate = mandates.reduce((oldest, m) =>
    m.startDate < oldest.startDate ? m : oldest
  )

  return {
    totalCities,
    totalMayors,
    totalWomen,
    longestMayor,
    longestYears: Math.round(longestYears),
    oldestMandateYear: oldestMandate.startDate.slice(0, 4),
  }
}
