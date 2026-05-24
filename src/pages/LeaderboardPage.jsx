import { useState, useEffect } from 'react'
import { getAllLeaderboardEntries } from '../lib/contract'
import { truncateAddress } from '../lib/utils'
import Spinner from '../components/Spinner'

const MEDAL_COLOR = { 1: '#8b5cf6', 2: '#0ea5e9', 3: '#ffffff' }

function getGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function toRoman(num) {
  if (typeof num !== 'number' || num < 1) return num;
  const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllLeaderboardEntries()
      setEntries(data)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = entries.filter(e =>
    search ? e.address.toLowerCase().includes(search.toLowerCase()) : true
  )

  const topScore = entries[0]?.score || 1

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 bg-transparent flex-1 w-full relative z-10 pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="url(#lb-grad)" strokeWidth={1.8}>
              <defs>
                <linearGradient id="lb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 012 2v1a4 4 0 01-4 4h-.5M8 4H6a2 2 0 00-2 2v1a4 4 0 004 4h.5M12 15v5m-4 0h8M7 4h10v7a5 5 0 01-10 0V4z" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-normal tracking-wide text-white">Leaderboard</h1>
        </div>
        <p className="text-white/60 ml-16 pl-1 font-sans">
          Global ranking of all contributors scored by AI validators onchain
        </p>
      </div>

      {/* Stats bar */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 fade-in-up">
          {[
            { label: 'Contributors', value: entries.length, color: '#8b5cf6' },
            { label: 'Top Score', value: entries[0]?.score ?? '—', color: '#0ea5e9' },
            { label: 'Avg Score', value: Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length) || '—', color: '#ffffff' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center transition-all hover:bg-white/10" style={{ borderColor: `${s.color}20` }}>
              <p className="font-sans font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5 font-sans">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by address…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-white font-mono text-sm placeholder-white/30 focus:border-purple/50 focus:bg-white/10 transition-colors"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all disabled:opacity-40 flex items-center gap-2 text-sm font-medium"
        >
          {loading ? <Spinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-32" />
                  <div className="h-2.5 bg-white/5 rounded w-48" />
                </div>
                <div className="w-16 h-8 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="font-heading text-xl font-semibold text-white mb-2">No entries yet</p>
          <p className="text-white/50 text-sm font-sans">Be the first to submit and get evaluated!</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3 fade-in-up">
          {filtered.map((entry, i) => {
            const isTop3 = entry.rank <= 3
            const barPct = Math.round((entry.score / topScore) * 100)
            const grade = getGrade(entry.score)

            return (
              <div
                key={entry.address}
                className="group bg-white/5 border border-white/10 rounded-2xl transition-all hover:scale-[1.01] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_24px_rgba(139,92,246,0.1)] duration-300"
                style={{
                  borderColor: isTop3 ? `${['#8b5cf6','#0ea5e9','#ffffff'][entry.rank-1]}50` : 'rgba(255,255,255,0.1)',
                  animationDelay: `${i * 0.05}s`
                }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 shrink-0 text-center">
                      {MEDAL_COLOR[entry.rank] ? (
                        <span
                          className="inline-flex items-center justify-center w-11 h-11 rounded-full"
                          style={{ color: MEDAL_COLOR[entry.rank], backgroundColor: `${MEDAL_COLOR[entry.rank]}12`, border: `1px solid ${MEDAL_COLOR[entry.rank]}35` }}
                        >
                          <span className="font-heading font-bold text-xl leading-none">{toRoman(entry.rank)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center">
                          <span className="font-heading text-lg font-bold text-white/30">{toRoman(entry.rank)}</span>
                        </span>
                      )}
                    </div>

                    {/* Address + bar */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-white font-medium mb-2 truncate">
                        {entry.address}
                      </p>
                      {/* Score bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barPct}%`,
                              background: `linear-gradient(90deg, #8b5cf6, #0ea5e9)`
                            }}
                          />
                        </div>
                        <span className="text-xs text-white/50 shrink-0 font-sans">{barPct}%</span>
                      </div>
                    </div>

                    {/* Grade badge */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0 border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                      <span style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #0ea5e9)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {grade}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0 min-w-[72px]">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/50 text-[#8B5CF6] text-xs font-bold font-sans">
                        {entry.score} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40 font-sans">
        <p>Scores are cumulative across all AI-evaluated submissions.</p>
        {lastUpdated && (
          <p>Updated {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  )
}
