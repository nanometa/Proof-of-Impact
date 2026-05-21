import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTask, submitWork } from '../lib/contract'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'

export default function SubmitWorkPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [task, setTask] = useState(null)
  const [workUrl, setWorkUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const t = await getTask(taskId)
        setTask(t)
      } catch (e) {
        console.error('Failed to load task:', e)
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [taskId])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!workUrl.trim() || !description.trim()) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    setLoading(true)
    try {
      const result = await submitWork(taskId, workUrl.trim(), description.trim())
      if (result.hash) {
        addToast({ type: 'success', message: 'Work submitted successfully!', txHash: result.hash })
        navigate(`/task/${taskId}`)
      }
    } catch (e) {
      addToast({ type: 'error', message: e.message || 'Failed to submit work' })
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/task/${taskId}`} className="inline-flex items-center text-sm text-muted hover:text-text mb-6 transition-colors">
        ← Back to Task
      </Link>

      {/* Task summary */}
      {task && (
        <div className="bg-surface/50 border border-border rounded-lg p-4 mb-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Submitting work for</p>
          <h2 className="font-heading font-semibold text-text">{task.title}</h2>
          <p className="text-sm text-muted mt-1 line-clamp-2">{task.description}</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6">
        <h1 className="font-heading text-2xl font-bold text-text mb-6">Submit Your Work</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-muted mb-1.5">Work URL</label>
            <input
              type="url"
              value={workUrl}
              onChange={e => setWorkUrl(e.target.value)}
              placeholder="https://github.com/yourrepo or link to your work"
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you built and how it meets the criteria..."
              rows={5}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-purple hover:bg-purple/80 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Submitting...
              </>
            ) : (
              'Submit Work'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
