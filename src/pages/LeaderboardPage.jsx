import { useState } from 'react'
import { getLeaderboardScore } from '../lib/contract'
import { truncateAddress } from '../lib/utils'
import Spinner from '../components/Spinner'

export default function LeaderboardPage() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!address.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const score = await getLeaderboardScore(address.trim())
      setResult({ address: address.trim(), score })
    } catch (e) {
      setError(e.message || 'Failed to fetch score')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-text mb-2">Leaderboard</h1>
      <p className="text-muted mb-8">Check cumulative scores for any contributor address.</p>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Enter address to check score"
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-text font-mono text-sm placeholder-muted/50 focus:outline-none focus:border-purple transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-purple hover:bg-purple/80 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" /> : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg p-4 text-red text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-surface border border-border rounded-xl p-6 fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Address</p>
              <p className="font-mono text-sm text-text">{truncateAddress(result.address)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Total Points</p>
              <p className="font-heading text-3xl font-bold text-purple">{result.score}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted mt-6 text-center">
        Scores are cumulative across all evaluated submissions.
      </p>
    </div>
  )
}
