import { getGradeColor } from '../lib/utils'

export default function GradeBadge({ grade, size = 'md' }) {
  const color = getGradeColor(grade)
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center font-heading font-bold rounded-md border ${sizeClass}`}
      style={{ color, borderColor: color, backgroundColor: `${color}15` }}
    >
      {grade}
    </span>
  )
}
