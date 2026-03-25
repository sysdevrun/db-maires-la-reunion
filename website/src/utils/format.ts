export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function computeDuration(start: string, end: string | null): string {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const days = Math.floor((e - s) / (24 * 60 * 60 * 1000))
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`
  const months = Math.round(days / 30.44)
  if (months < 12) return `${months} mois`
  const years = Math.round(days / 365.25)
  return `${years} an${years > 1 ? 's' : ''}`
}
