import { Link } from 'react-router-dom'
import { computeStats } from '../data/loader'

const stats = computeStats()

export default function Stats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Link to="/communes">
        <StatCard value={stats.totalCities} label="Communes" />
      </Link>
      <StatCard value={stats.totalMayors} label="Maires recensés" />
      <StatCard value={stats.totalMandates} label="Mandats" />
      <StatCard value={stats.totalWomen} label="Femmes maires" />
    </div>
  )
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-blue-600">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  )
}
