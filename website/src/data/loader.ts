import Papa from 'papaparse'
import citiesRaw from '../../../data/communes.csv?raw'
import mayorsRaw from '../../../data/maires.csv?raw'
import mandatesRaw from '../../../data/mandats.csv?raw'

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

function parseCSV<T>(raw: string): T[] {
  const result = Papa.parse<T>(raw.trim(), { header: true, skipEmptyLines: true })
  return result.data
}

function loadCities(): City[] {
  return parseCSV<{ code_insee: string; nom: string }>(citiesRaw).map(r => ({
    cityId: r.code_insee,
    name: r.nom,
  }))
}

function loadMayors(): Mayor[] {
  return parseCSV<{ nom: string; prenom: string; date_naissance: string; genre: string }>(mayorsRaw).map(r => ({
    lastName: r.nom,
    firstName: r.prenom,
    birthDate: r.date_naissance || null,
    gender: r.genre as 'M' | 'F',
  }))
}

function loadMandates(): Mandate[] {
  return parseCSV<{ code_insee: string; nom_maire: string; date_debut: string; date_fin: string }>(mandatesRaw).map(r => ({
    cityId: r.code_insee,
    mayorName: r.nom_maire,
    startDate: r.date_debut,
    endDate: r.date_fin?.trim() || null,
  }))
}

export const cities = loadCities()
export const mayors = loadMayors()
export const mandates = loadMandates()

const cityByName = new Map(cities.map(c => [c.name, c]))
const cityBySlug = new Map(cities.map(c => [citySlug(c.name), c]))
const cityById = new Map(cities.map(c => [c.cityId, c]))

export function getCityByName(name: string): City | undefined {
  return cityByName.get(name)
}

export function getCityBySlug(slug: string): City | undefined {
  return cityBySlug.get(slug)
}

export function getCityById(id: string): City | undefined {
  return cityById.get(id)
}

export function citySlug(name: string): string {
  return name.replace(/ /g, '-')
}

export function mayorSlug(m: Mayor): string {
  return `${m.firstName}-${m.lastName}`.replace(/ /g, '-')
}

export function getMayorByKey(key: string): Mayor | undefined {
  return mayors.find(m => mayorSlug(m) === key)
}

export function mayorKey(m: Mayor): string {
  return mayorSlug(m)
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
      link: `/commune/${citySlug(c.name)}`,
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
      link: `/maire/${mayorSlug(m)}`,
      gender: m.gender,
    }))

  return [...cityResults, ...mayorResults].slice(0, 20)
}

export function computeStats() {
  const totalCities = cities.length
  const totalMayors = mayors.length
  const totalMandates = mandates.length
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
    totalMandates,
    totalWomen,
    longestMayor,
    longestYears: Math.round(longestYears),
    oldestMandateYear: oldestMandate.startDate.slice(0, 4),
  }
}

export interface TriviaFact {
  value: string
  label: string
  sublabel?: string
  link?: string
}

export function computeTrivia(): TriviaFact[] {
  const facts: TriviaFact[] = []

  // Longest career
  const mandateDurations = new Map<string, number>()
  for (const m of mandates) {
    const start = new Date(m.startDate).getTime()
    const end = m.endDate ? new Date(m.endDate).getTime() : Date.now()
    const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000)
    mandateDurations.set(m.mayorName, (mandateDurations.get(m.mayorName) ?? 0) + years)
  }
  let longestName = ''
  let longestYears = 0
  for (const [name, years] of mandateDurations) {
    if (years > longestYears) { longestName = name; longestYears = years }
  }
  const longestMayor = findMayorByFullName(longestName)
  facts.push({
    value: `${Math.round(longestYears)} ans`,
    label: longestName,
    sublabel: 'Plus longue carrière',
    link: longestMayor ? `/maire/${mayorSlug(longestMayor)}` : undefined,
  })

  // Youngest mayor at election
  let youngestAge = Infinity
  let youngestName = ''
  let youngestMayor: Mayor | undefined
  for (const m of mandates) {
    const mayor = findMayorByFullName(m.mayorName)
    if (!mayor?.birthDate) continue
    const birth = new Date(mayor.birthDate).getTime()
    const start = new Date(m.startDate).getTime()
    const age = (start - birth) / (365.25 * 24 * 60 * 60 * 1000)
    if (age > 0 && age < youngestAge) {
      youngestAge = age
      youngestName = m.mayorName
      youngestMayor = mayor
    }
  }
  facts.push({
    value: `${Math.floor(youngestAge)} ans`,
    label: youngestName,
    sublabel: 'Plus jeune maire élu',
    link: youngestMayor ? `/maire/${mayorSlug(youngestMayor)}` : undefined,
  })

  // Oldest mayor at election
  let oldestAge = 0
  let oldestName = ''
  let oldestMayor: Mayor | undefined
  for (const m of mandates) {
    const mayor = findMayorByFullName(m.mayorName)
    if (!mayor?.birthDate) continue
    const birth = new Date(mayor.birthDate).getTime()
    const start = new Date(m.startDate).getTime()
    const age = (start - birth) / (365.25 * 24 * 60 * 60 * 1000)
    if (age > oldestAge) {
      oldestAge = age
      oldestName = m.mayorName
      oldestMayor = mayor
    }
  }
  facts.push({
    value: `${Math.floor(oldestAge)} ans`,
    label: oldestName,
    sublabel: 'Maire le plus âgé à son élection',
    link: oldestMayor ? `/maire/${mayorSlug(oldestMayor)}` : undefined,
  })

  // Mayor with most mandates
  const mandateCounts = new Map<string, number>()
  for (const m of mandates) {
    mandateCounts.set(m.mayorName, (mandateCounts.get(m.mayorName) ?? 0) + 1)
  }
  let mostMandatesName = ''
  let mostMandatesCount = 0
  for (const [name, count] of mandateCounts) {
    if (count > mostMandatesCount) { mostMandatesName = name; mostMandatesCount = count }
  }
  const mostMandatesMayor = findMayorByFullName(mostMandatesName)
  facts.push({
    value: `${mostMandatesCount} mandats`,
    label: mostMandatesName,
    sublabel: 'Plus grand nombre de mandats',
    link: mostMandatesMayor ? `/maire/${mayorSlug(mostMandatesMayor)}` : undefined,
  })

  // City with most different mayors
  const cityMayorSets = new Map<string, Set<string>>()
  for (const m of mandates) {
    if (!cityMayorSets.has(m.cityId)) cityMayorSets.set(m.cityId, new Set())
    cityMayorSets.get(m.cityId)!.add(m.mayorName)
  }
  let mostMayorsCityId = ''
  let mostMayorsCount = 0
  for (const [cityId, mayorSet] of cityMayorSets) {
    if (mayorSet.size > mostMayorsCount) { mostMayorsCityId = cityId; mostMayorsCount = mayorSet.size }
  }
  const mostMayorsCity = getCityById(mostMayorsCityId)
  facts.push({
    value: `${mostMayorsCount} maires`,
    label: mostMayorsCity?.name ?? mostMayorsCityId,
    sublabel: 'Commune avec le plus de maires',
    link: mostMayorsCity ? `/commune/${citySlug(mostMayorsCity.name)}` : undefined,
  })

  // Oldest mandate on record
  const oldestMandate = mandates.reduce((oldest, m) =>
    m.startDate < oldest.startDate ? m : oldest
  )
  const oldestCity = getCityById(oldestMandate.cityId)
  facts.push({
    value: oldestMandate.startDate.slice(0, 4),
    label: oldestMandate.mayorName,
    sublabel: `Plus ancien mandat recensé (${oldestCity?.name ?? ''})`,
    link: oldestCity ? `/commune/${citySlug(oldestCity.name)}` : undefined,
  })

  return facts
}
