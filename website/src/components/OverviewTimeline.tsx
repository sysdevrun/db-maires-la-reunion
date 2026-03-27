import { useState, useRef, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  cities,
  mandates,
  getMandatesForCity,
  citySlug,
  type Mandate,
} from '../data/loader'
import { assignColorsForCity } from '../utils/colors'

const END_YEAR = 2027
const ROW_HEIGHT = 36
const BAR_HEIGHT = 28
const TOP_MARGIN = 24
const BOTTOM_MARGIN = 30
const CHART_WIDTH = 1600

interface MandateEntry {
  startDate: string
  endDate: string | null
}

interface MergedBlock {
  mayorName: string
  mandates: MandateEntry[]
  overallStart: string
  overallEnd: string | null
}

interface TooltipState {
  x: number
  y: number
  mayorName: string
  commune: string
  mandates: MandateEntry[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mergeConsecutiveMandates(sortedMandates: Mandate[]): MergedBlock[] {
  const blocks: MergedBlock[] = []
  for (const m of sortedMandates) {
    const last = blocks[blocks.length - 1]
    if (last && last.mayorName === m.mayorName) {
      last.mandates.push({ startDate: m.startDate, endDate: m.endDate ?? null })
      last.overallEnd = m.endDate ?? null
    } else {
      blocks.push({
        mayorName: m.mayorName,
        mandates: [{ startDate: m.startDate, endDate: m.endDate ?? null }],
        overallStart: m.startDate,
        overallEnd: m.endDate ?? null,
      })
    }
  }
  return blocks
}

interface CommuneRow {
  cityName: string
  citySlug: string
  blocks: MergedBlock[]
  colors: string[]
}

export default function OverviewTimeline() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const startYear = useMemo(() => {
    const earliest = Math.min(...mandates.map((m) => new Date(m.startDate).getFullYear()))
    return earliest
  }, [])

  const rows: CommuneRow[] = useMemo(() => {
    const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return sorted.map((city, cityIndex) => {
      const cityMandates = getMandatesForCity(city.cityId)
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )

      const blocks = mergeConsecutiveMandates(cityMandates)
      const blockNames = blocks.map((b) => b.mayorName)
      const colors = assignColorsForCity(cityIndex, blockNames)

      return {
        cityName: city.name,
        citySlug: citySlug(city.name),
        blocks,
        colors,
      }
    })
  }, [])

  const totalHeight = rows.length * ROW_HEIGHT + TOP_MARGIN + BOTTOM_MARGIN

  function yearToX(year: number): number {
    return ((year - startYear) / (END_YEAR - startYear)) * CHART_WIDTH
  }

  function dateToX(d: Date): number {
    const year =
      d.getFullYear() + (d.getMonth() + (d.getDate() - 1) / 30) / 12
    return yearToX(year)
  }

  const decades = []
  const firstDecade = Math.ceil(startYear / 10) * 10
  for (let y = firstDecade; y <= 2020; y += 10) decades.push(y)

  function showTooltip(
    e: React.MouseEvent,
    block: MergedBlock,
    communeName: string
  ) {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      mayorName: block.mayorName,
      commune: communeName,
      mandates: block.mandates,
    })
  }

  function hideTooltip() {
    setTooltip(null)
  }

  // Extract last name from "FirstName LastName"
  function lastName(fullName: string): string {
    const parts = fullName.split(' ')
    return parts.length > 1 ? parts.slice(1).join(' ') : fullName
  }

  return (
    <div className="flex" ref={containerRef} style={{ position: 'relative' }}>
      {/* Fixed commune name column */}
      <div className="shrink-0 z-10 bg-white">
        <div style={{ height: TOP_MARGIN }} />
        {rows.map((row) => (
          <div
            key={row.cityName}
            style={{ height: ROW_HEIGHT }}
            className="flex items-center pr-3 justify-end"
          >
            <Link
              to={`/commune/${row.citySlug}`}
              className="text-gray-600 text-xs hover:text-blue-600 transition-colors text-right whitespace-nowrap"
            >
              {row.cityName}
            </Link>
          </div>
        ))}
      </div>

      {/* Scrollable SVG chart */}
      <div className="flex-1 overflow-x-auto" ref={scrollRef}>
        <svg
          width={CHART_WIDTH}
          height={totalHeight}
          style={{ display: 'block' }}
        >
          {/* Decade grid lines */}
          {decades.map((year) => {
            const x = yearToX(year)
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={TOP_MARGIN}
                  x2={x}
                  y2={totalHeight - BOTTOM_MARGIN}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={totalHeight - BOTTOM_MARGIN + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#9ca3af"
                >
                  {year}
                </text>
              </g>
            )
          })}

          {/* Rows */}
          {rows.map((row, rowIndex) => {
            const y = TOP_MARGIN + rowIndex * ROW_HEIGHT
            const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2

            return (
              <g key={row.cityName}>
                {/* Subtle row separator */}
                <line
                  x1={0}
                  y1={y + ROW_HEIGHT}
                  x2={CHART_WIDTH}
                  y2={y + ROW_HEIGHT}
                  stroke="#f3f4f6"
                  strokeWidth={0.5}
                />

                {/* Merged mandate blocks */}
                {row.blocks.map((block, i) => {
                  const now = new Date()
                  const startD = new Date(
                    Math.max(
                      new Date(block.overallStart).getTime(),
                      new Date(`${startYear}-01-01`).getTime()
                    )
                  )
                  const endD = block.overallEnd ? new Date(block.overallEnd) : now
                  const x1 = dateToX(startD)
                  const x2 = dateToX(endD)
                  const width = Math.max(x2 - x1, 2)
                  const color = row.colors[i] ?? '#94a3b8'

                  const name = lastName(block.mayorName)
                  const showName = width > 30

                  // Truncate name if needed
                  const charWidth = 5.5
                  const maxChars = Math.floor((width - 6) / charWidth)
                  const displayName =
                    showName && name.length > maxChars && maxChars > 2
                      ? name.slice(0, maxChars - 1) + '.'
                      : name

                  return (
                    <g
                      key={i}
                      style={{ cursor: 'pointer' }}
                      onMouseMove={(e) => showTooltip(e, block, row.cityName)}
                      onMouseLeave={hideTooltip}
                    >
                      <rect
                        x={x1}
                        y={barY}
                        width={width}
                        height={BAR_HEIGHT}
                        fill={color}
                        rx={3}
                        ry={3}
                      />
                      {showName && (
                        <text
                          x={x1 + width / 2}
                          y={barY + BAR_HEIGHT / 2 + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={9}
                          fontWeight={600}
                          fill="white"
                        >
                          {displayName}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="bg-white border border-gray-200 shadow-md text-sm px-3 py-2 rounded"
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 20,
          }}
        >
          <div className="font-semibold text-gray-800">{tooltip.mayorName}</div>
          <div className="text-gray-400 text-xs">{tooltip.commune}</div>
          <div className="mt-1">
            {tooltip.mandates.map((m, i) => (
              <div key={i} className="text-gray-500 text-xs">
                {formatDate(m.startDate)} — {m.endDate ? formatDate(m.endDate) : 'en cours'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
