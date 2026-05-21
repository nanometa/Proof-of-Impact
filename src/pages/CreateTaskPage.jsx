import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createTask } from '../lib/contract'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !criteria.trim() || !rewardPoints) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    setLoading(true)
    try {
      const result = await createTask(title.trim(), description.trim(), criteria.trim(), Number(rewardPoints))
      if (result.hash) {
        addToast({ type: 'success', message: 'Task created successfully!', txHash: result.hash })
        navigate('/app')
      }
    } catch (e) {
      addToast({ type: 'error', message: e.message || 'Failed to create task' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/app" className="inline-flex items-center text-sm text-muted hover:text-text mb-6 transition-colors">
        ← Back to Tasks
      </Link>

      <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-xl p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Create Task</h1>
        <p className="text-sm text-muted mb-6">Define work for contributors to complete and earn rewards.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-muted mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Build a landing page"
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              rows={4}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Evaluation Criteria</label>
            <textarea
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              placeholder="e.g. Code quality, Documentation, Tests"
              rows={3}
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Reward Points</label>
            <input
              type="number"
              min="1"
              value={rewardPoints}
              onChange={e => setRewardPoints(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted/50 focus:outline-none focus:border-purple transition-colors"
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
                Creating Task...
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
