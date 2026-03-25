import { computeStats } from '../data/loader'

const stats = computeStats()

export default function Stats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard value={stats.totalCities} label="Communes" />
      <StatCard value={stats.totalMayors} label="Maires recensés" />
      <StatCard value={stats.totalWomen} label="Femmes maires" />
      <StatCard
        value={`${stats.longestYears} ans`}
        label={stats.longestMayor}
        sublabel="Plus longue carrière"
      />
    </div>
  )
}

function StatCard({ value, label, sublabel }: { value: string | number; label: string; sublabel?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-blue-600">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{sublabel ?? label}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{label}</div>}
    </div>
  )
}
