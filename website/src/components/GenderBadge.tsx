export default function GenderBadge({ gender }: { gender: 'M' | 'F' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${
        gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'
      }`}
      title={gender === 'F' ? 'Femme' : 'Homme'}
    >
      {gender === 'F' ? 'F' : 'H'}
    </span>
  )
}
