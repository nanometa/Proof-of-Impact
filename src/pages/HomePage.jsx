import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadAllTasks, getTaskCount, getSubmissionCount } from '../lib/contract'
import { truncateAddress } from '../lib/utils'
import Spinner from '../components/Spinner'

const HIDDEN_KEY = 'gl_hidden_tasks'

function getHidden() {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')) } catch { return new Set() }
}

function setHidden(set) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]))
}

// Detect spammy/test tasks (very short title or description like "." or "test")
function isSpammy(task) {
  const t = (task.title || '').trim()
  const d = (task.description || '').trim()
  if (t.length < 3) return true
  if (d.length < 10) return true
  if (/^[.\-_,!?]+$/.test(t)) return true
  return false
}

export default function HomePage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [taskCount, setTaskCount] = useState(0)
  const [subCount, setSubCount] = useState(0)
  const [hidden, setHiddenState] = useState(getHidden())
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [allTasks, tc, sc] = await Promise.all([
          loadAllTasks(),
          getTaskCount(),
          getSubmissionCount(),
        ])
        setTasks(allTasks)
        setTaskCount(tc)
        setSubCount(sc)
      } catch (e) {
        console.error('Failed to load tasks:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function hideTask(id) {
    const next = new Set(hidden)
    next.add(id)
    setHidden(next)
    setHiddenState(next)
  }

  function unhideAll() {
    setHidden(new Set())
    setHiddenState(new Set())
  }

  // Filter pipeline
  let visible = tasks
  if (!showHidden) {
    visible = visible.filter(t => !hidden.has(t.task_id) && !isSpammy(t))
  }
  const filtered = filter === 'all' ? visible : visible.filter(t => t.status === filter)
  const hiddenCount = tasks.length - visible.length

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div className="absolute inset-0 animated-grid pointer-events-none overflow-hidden" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted mb-10 pb-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="font-mono">{taskCount}</span>
            <span>Tasks Created</span>
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
            <span className="font-mono">{subCount}</span>
            <span>Submissions</span>
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            <span className="text-purple font-medium">Powered by GenLayer AI</span>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-14 pt-4">
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold mb-5 leading-tight">
            <span className="gradient-text">Work. Prove. Earn.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl leading-relaxed">
            AI validators score your work on-chain. No bias. No middlemen. Pure merit.
          </p>
        </div>

        {/* Filter tabs + hidden toggle */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-1 bg-surface/80 backdrop-blur-sm rounded-xl p-1 border border-border">
            {['all', 'open', 'closed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                  filter === f
                    ? 'bg-purple text-white shadow-lg shadow-purple/20'
                    : 'text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="text-xs text-muted hover:text-purple transition-colors"
              >
                {showHidden ? `Hide spam (${hiddenCount})` : `Show hidden (${hiddenCount})`}
              </button>
            )}
            {showHidden && hidden.size > 0 && (
              <button
                onClick={unhideAll}
                className="text-xs text-purple hover:text-purple/80 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Task grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-muted text-sm">Loading tasks from contract...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg text-text mb-1">No tasks found</p>
            <p className="text-sm text-muted">Create the first task to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((task, i) => (
              <div
                key={task.task_id}
                className="relative bg-surface/80 backdrop-blur-sm border border-border rounded-xl p-5 card-glow group fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Hide button */}
                <button
                  onClick={(e) => { e.preventDefault(); hideTask(task.task_id) }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md bg-bg/80 border border-border/50 text-muted/50 hover:text-red hover:border-red/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs"
                  title="Hide from list"
                >
                  ✕
                </button>

                <div className="flex items-start justify-between gap-3 mb-3 pr-6">
                  <h3 className="font-heading font-semibold text-text group-hover:text-purple transition-colors line-clamp-1 text-[15px]">
                    {task.title}
                  </h3>
                  <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                    task.status === 'open'
                      ? 'bg-green/10 text-green border border-green/20'
                      : 'bg-muted/10 text-muted border border-muted/20'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <p className="text-sm text-muted/80 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                <div className="mb-4">
                  <span className="inline-block text-[11px] px-2.5 py-1 rounded-md bg-bg border border-border text-muted/70 font-medium truncate max-w-full">
                    {task.criteria}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted/60">{truncateAddress(task.creator)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-purple/10 text-purple text-[11px] font-bold border border-purple/20">
                      {task.reward_points} pts
                    </span>
                    <Link
                      to={`/task/${task.task_id}`}
                      className="text-[11px] text-purple/70 hover:text-purple font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/create"
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple hover:bg-purple/90 text-white rounded-full flex items-center justify-center shadow-xl shadow-purple/30 transition-all hover:scale-105 z-30 pulse-glow"
        title="Create Task"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
