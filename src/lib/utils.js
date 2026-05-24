export function truncateAddress(address) {
  if (!address || address.length < 10) return address || ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
