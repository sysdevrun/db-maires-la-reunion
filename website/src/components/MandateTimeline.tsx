import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
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

export default function MandateTimeline({ mandates }: Props) {
  if (mandates.length === 0) return null

  const sorted = [...mandates].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const minYear = new Date(sorted[0].startDate).getFullYear()
  const currentYear = new Date().getFullYear()
  const maxYear = sorted.reduce((max, m) => {
    if (!m.endDate) return Math.max(max, currentYear)
    return Math.max(max, new Date(m.endDate).getFullYear())
  }, 0)

  const data = sorted.map((m) => {
    const start = new Date(m.startDate).getFullYear()
    const end = m.endDate ? new Date(m.endDate).getFullYear() : new Date().getFullYear()
    const mayor = findMayorByFullName(m.mayorName)
    return {
      name: m.mayorName,
      offset: start - minYear,
      duration: Math.max(end - start, 1),
      startDate: m.startDate,
      endDate: m.endDate,
      gender: mayor?.gender ?? 'M',
    }
  })

  const height = Math.max(data.length * 40 + 60, 200)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        barCategoryGap="20%"
      >
        <XAxis
          type="number"
          domain={[0, maxYear - minYear + 1]}
          tickFormatter={(v: number) => String(minYear + v)}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={({ active, payload }: any) => {
            if (!active || !payload?.[1]) return null
            const d = payload[1].payload
            const end = d.endDate ? formatDate(d.endDate) : 'en cours'
            return (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
                <div className="font-semibold text-gray-800">{d.name}</div>
                <div className="text-gray-500">{formatDate(d.startDate)} — {end}</div>
              </div>
            )
          }}
        />
        <Bar dataKey="offset" stackId="stack" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="duration" stackId="stack" isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.gender === 'F' ? '#f472b6' : '#60a5fa'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
