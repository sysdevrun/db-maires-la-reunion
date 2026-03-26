import { Link } from 'react-router-dom'
import { computeTrivia, type TriviaFact } from '../data/loader'

const facts = computeTrivia()

export default function Trivia() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {facts.map((fact, i) => (
        <TriviaCard key={i} fact={fact} />
      ))}
    </div>
  )
}

function TriviaCard({ fact }: { fact: TriviaFact }) {
  const content = (
    <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
      <div className="text-2xl font-bold text-blue-600">{fact.value}</div>
      <div className="text-sm text-gray-600 mt-1">{fact.sublabel}</div>
      <div className="text-xs text-gray-400 mt-0.5">{fact.label}</div>
    </div>
  )

  if (fact.link) {
    return <Link to={fact.link}>{content}</Link>
  }
  return content
}
