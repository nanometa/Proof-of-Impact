import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTask, loadSubmissionsForTask } from '../lib/contract'
import { truncateAddress } from '../lib/utils'
import ScoreCircle from '../components/ScoreCircle'
import Spinner from '../components/Spinner'

export default function TaskPage() {
  const { taskId } = useParams()
  const [task, setTask] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [t, subs] = await Promise.all([
          getTask(taskId),
          loadSubmissionsForTask(taskId),
        ])
        setTask(t)
        setSubmissions(subs)
      } catch (e) {
        console.error('Failed to load task:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red">Task not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link to="/app" className="inline-flex items-center text-sm text-muted hover:text-text mb-6 transition-colors">
        ← Back to Tasks
      </Link>

      {/* Task header card */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-text">{task.title}</h1>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              task.status === 'open' ? 'bg-green/10 text-green' : 'bg-muted/10 text-muted'
            }`}>
              {task.status}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple/10 text-purple text-xs font-bold">
              {task.reward_points} pts
            </span>
          </div>
        </div>

        <p className="text-text/80 mb-4">{task.description}</p>

        <div className="bg-bg rounded-lg p-4 border border-border mb-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Evaluation Criteria</p>
          <p className="text-sm text-text">{task.criteria}</p>
        </div>

        <p className="text-xs text-muted">
          Created by <span className="font-mono text-text/70">{truncateAddress(task.creator)}</span>
        </p>
      </div>

      {/* Submissions section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-text">
            Submissions ({submissions.length})
          </h2>
          {task.status === 'open' && (
            <Link
              to={`/task/${taskId}/submit`}
              className="px-4 py-2 rounded-lg bg-purple hover:bg-purple/80 text-white text-sm font-medium transition-colors"
            >
              Submit Your Work
            </Link>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-muted">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map(sub => (
              <div key={sub.sub_id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-muted">{truncateAddress(sub.worker)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sub.status === 'evaluated' ? 'bg-green/10 text-green' : 'bg-yellow/10 text-yellow'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {sub.status === 'evaluated' && sub.score !== undefined && (
                    <ScoreCircle score={sub.score} size={36} />
                  )}
                  <Link
                    to={`/submission/${sub.sub_id}`}
                    className="text-xs text-purple hover:text-purple/80 font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
