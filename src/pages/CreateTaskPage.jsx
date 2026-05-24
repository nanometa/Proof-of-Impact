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
    <div className="max-w-2xl mx-auto px-6 py-10 relative z-10 pb-16 fade-in-up">
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tasks
      </Link>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#ct-grad)" strokeWidth={1.8}>
              <defs>
                <linearGradient id="ct-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-white tracking-wide">Create Task</h1>
        </div>
        <p className="text-sm text-white/50 mb-8 ml-[52px] font-sans">Define work for contributors to complete and earn rewards.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Build a landing page"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-sans text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors resize-none font-sans text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Evaluation Criteria</label>
            <textarea
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              placeholder="e.g. Code quality, Documentation, Tests"
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors resize-none font-sans text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Reward Points</label>
            <input
              type="number"
              min="1"
              value={rewardPoints}
              onChange={e => setRewardPoints(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full heroSecondary text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
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
