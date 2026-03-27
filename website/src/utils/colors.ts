// Base hues for cities (one per city, spread across the color wheel)
const CITY_HUES = [
  0, 15, 30, 45, 60, 80, 100, 120, 145, 165,
  185, 200, 215, 230, 250, 270, 290, 310, 325, 340,
  10, 50, 140, 260,
]

/**
 * Returns an HSL color string for each mayor block within a city.
 * Colors form a gradient: lightness progresses from dark to light
 * across the timeline. When a mayor reappears (non-consecutive),
 * they get a new shade at the current position in the gradient.
 */
export function assignColorsForCity(
  cityIndex: number,
  blockNames: string[]
): string[] {
  const hue = CITY_HUES[cityIndex % CITY_HUES.length]
  const count = blockNames.length

  return blockNames.map((_, i) => {
    // Lightness goes from 30% (dark) to 65% (light) across the timeline
    const t = count > 1 ? i / (count - 1) : 0.5
    const lightness = 30 + t * 35
    // Saturation decreases slightly as lightness increases
    const saturation = 50 - t * 15
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  })
}
