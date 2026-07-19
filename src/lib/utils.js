import { formatUnits } from 'viem'

export function truncateAddress(address) {
  if (!address || address.length < 10) return address || ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatGen(value, maxDecimals = 4) {
  try {
    const formatted = formatUnits(BigInt(value || 0), 18)
    const [whole, decimals = ''] = formatted.split('.')
    const trimmed = decimals.slice(0, maxDecimals).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  } catch {
    return '0'
  }
}

export function formatDeadline(timestamp) {
  const value = Number(timestamp || 0)
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value * 1000))
}

export function getScoreColor(score) {
  if (score >= 90) return '#10b981'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f59e0b'
  if (score >= 60) return '#f97316'
  return '#ef4444'
}

export function getGradeColor(grade) {
  const map = {
    A: '#10b981',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  }
  return map[grade] || '#64748b'
}

export function getExplorerLink(txHash) {
  return `https://explorer-bradbury.genlayer.com/tx/${txHash}`
}
