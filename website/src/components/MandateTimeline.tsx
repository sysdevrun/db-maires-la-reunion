import { useState, useRef } from 'react'
import { type Mandate, findMayorByFullName } from '../data/loader'

interface Props {
  mandates: Mandate[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface MandateEntry {
  startDate: string
  endDate: string | null
}

interface MayorSequence {
  name: string
  gender: string
  mandates: MandateEntry[]
}

function groupIntoSequences(mandates: Mandate[]): MayorSequence[] {
  const sorted = [...mandates].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const sequences: MayorSequence[] = []
  for (const m of sorted) {
    const last = sequences[sequences.length - 1]
    if (last && last.name === m.mayorName) {
      last.mandates.push({ startDate: m.startDate, endDate: m.endDate ?? null })
    } else {
      const mayor = findMayorByFullName(m.mayorName)
      sequences.push({
        name: m.mayorName,
        gender: mayor?.gender ?? 'M',
        mandates: [{ startDate: m.startDate, endDate: m.endDate ?? null }],
      })
    }
  }
  return sequences
}

interface TooltipState {
  x: number
  y: number
  name: string
  mandates: MandateEntry[]
  highlightIndex: number | null // null = show all (label hover)
}

// First-round dates of French municipal elections (La Réunion)
const ELECTION_FIRST_ROUNDS = [
  '1900-05-06', '1904-05-01', '1908-05-03', '1912-05-05', '1919-11-30',
  '1925-05-03', '1929-05-05', '1935-05-05', '1945-04-29', '1947-10-19',
  '1953-04-26', '1959-03-08', '1965-03-14', '1971-03-14', '1977-03-13',
  '1983-03-06', '1989-03-12', '1995-06-11', '2001-03-11', '2008-03-09',
  '2014-03-23', '2020-03-15', '2026-03-15',
]

// Elections whose label should be hidden (line still drawn)
const HIDDEN_LABELS = new Set(['1945-04-29'])

const ROW_HEIGHT = 36
const BAR_HEIGHT = 20
const LABEL_WIDTH = 180
const RIGHT_MARGIN = 30
const TOP_MARGIN = 25
const BOTTOM_MARGIN = 30

export default function MandateTimeline({ mandates }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (mandates.length === 0) return null

  const sequences = groupIntoSequences(mandates)

  const now = new Date()
  const allDates = mandates.flatMap((m) => [
    new Date(m.startDate),
    m.endDate ? new Date(m.endDate) : now,
  ])
  const minTime = Math.min(...allDates.map((d) => d.getTime()))
  const maxTime = Math.max(...allDates.map((d) => d.getTime()))
  const minYear = new Date(minTime).getFullYear()
  const maxYear = new Date(maxTime).getFullYear() + 1

  const chartHeight = sequences.length * ROW_HEIGHT + TOP_MARGIN + BOTTOM_MARGIN

  // Filter election dates to those visible in the chart range
  const visibleElections = ELECTION_FIRST_ROUNDS.filter((dateStr) => {
    const year = new Date(dateStr).getFullYear()
    return year >= minYear && year <= maxYear
  })

  function yearToFraction(year: number) {
    return (year - minYear) / (maxYear - minYear)
  }

  function dateToFraction(d: Date) {
    const year = d.getFullYear() + (d.getMonth() + (d.getDate() - 1) / 30) / 12
    return yearToFraction(year)
  }

  function showTooltip(
    e: React.MouseEvent<SVGElement>,
    seq: MayorSequence,
    blockIndex: number | null
  ) {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      name: seq.name,
      mandates: seq.mandates,
      highlightIndex: blockIndex,
    })
  }

  function hideTooltip() {
    setTooltip(null)
  }

  function formatMandateLine(m: MandateEntry) {
    const end = m.endDate ? formatDate(m.endDate) : 'en cours'
    return `${formatDate(m.startDate)} — ${end}`
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
      <svg
        width="100%"
        viewBox={`0 0 800 ${chartHeight}`}
        style={{ minWidth: 600, display: 'block' }}
      >
        {/* Election year ticks */}
        {visibleElections.map((dateStr) => {
          const d = new Date(dateStr)
          const frac = dateToFraction(d)
          const x = LABEL_WIDTH + frac * (800 - LABEL_WIDTH - RIGHT_MARGIN)
          return (
            <g key={dateStr}>
              <line
                x1={x}
                y1={TOP_MARGIN}
                x2={x}
                y2={chartHeight - BOTTOM_MARGIN}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={x}
                y={chartHeight - BOTTOM_MARGIN + 18}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
              >
                {HIDDEN_LABELS.has(dateStr) ? '' : d.getFullYear()}
              </text>
            </g>
          )
        })}

        {/* Rows */}
        {sequences.map((seq, rowIndex) => {
          const y = TOP_MARGIN + rowIndex * ROW_HEIGHT
          const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2
          const barColor = seq.gender === 'F' ? '#f472b6' : '#7fadee'
          const strokeColor = seq.gender === 'F' ? '#db2777' : '#3b82f6'

          return (
            <g key={rowIndex}>
              {/* Mayor name label (hoverable) */}
              <text
                x={LABEL_WIDTH - 8}
                y={y + ROW_HEIGHT / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={12}
                fill="#374151"
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => showTooltip(e, seq, null)}
                onMouseLeave={hideTooltip}
              >
                {seq.name}
              </text>

              {/* Mandate blocks */}
              {seq.mandates.map((m, blockIndex) => {
                const startD = new Date(m.startDate)
                const endD = m.endDate ? new Date(m.endDate) : now
                const x1 =
                  LABEL_WIDTH +
                  dateToFraction(startD) * (800 - LABEL_WIDTH - RIGHT_MARGIN)
                const x2 =
                  LABEL_WIDTH +
                  dateToFraction(endD) * (800 - LABEL_WIDTH - RIGHT_MARGIN)
                const width = Math.max(x2 - x1, 3)

                return (
                  <rect
                    key={blockIndex}
                    x={x1}
                    y={barY}
                    width={width}
                    height={BAR_HEIGHT}
                    fill={barColor}
                    stroke={strokeColor}
                    strokeWidth={1}
                    style={{ cursor: 'pointer' }}
                    onMouseMove={(e) => showTooltip(e, seq, blockIndex)}
                    onMouseLeave={hideTooltip}
                  />
                )
              })}
            </g>
          )
        })}

        {/* Y-axis line */}
        <line
          x1={LABEL_WIDTH}
          y1={TOP_MARGIN}
          x2={LABEL_WIDTH}
          y2={chartHeight - BOTTOM_MARGIN}
          stroke="#d1d5db"
          strokeWidth={1}
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="bg-white border border-gray-200 shadow-md text-sm px-3 py-2"
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div className="font-semibold text-gray-800">{tooltip.name}</div>
          {tooltip.highlightIndex !== null ? (
            <div className="text-gray-500">
              {formatMandateLine(tooltip.mandates[tooltip.highlightIndex])}
            </div>
          ) : (
            tooltip.mandates.map((m, i) => (
              <div key={i} className="text-gray-500">
                {formatMandateLine(m)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
