export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function computeDuration(start: string, end: string | null): string {
  return formatDays(totalDays(start, end))
}

function totalDays(start: string, end: string | null): number {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  return Math.floor((e - s) / (24 * 60 * 60 * 1000))
}

function formatDays(days: number): string {
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`
  const months = Math.round(days / 30.44)
  if (months < 12) return `${months} mois`
  const years = Math.round(days / 365.25)
  return `${years} an${years > 1 ? 's' : ''}`
}

export function computeTotalDuration(mandates: { startDate: string; endDate: string | null }[]): string {
  const days = mandates.reduce((sum, m) => sum + totalDays(m.startDate, m.endDate), 0)
  return formatDays(days)
}
