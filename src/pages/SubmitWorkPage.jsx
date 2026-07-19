import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTask, submitWork } from '../lib/contract'
import { useToast } from '../context/ToastContext'
import { formatDeadline, formatGen } from '../lib/utils'
import Spinner from '../components/Spinner'

export default function SubmitWorkPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [task, setTask] = useState(null)
  const [workUrl, setWorkUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
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
    setSubmitStatus('Submitting transaction...')
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
      setSubmitStatus('')
    }
  }

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="lg" />
        <p className="text-white/60 text-sm">Loading task...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 relative z-10 pb-16 fade-in-up">
      <Link to={`/task/${taskId}`} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Task
      </Link>

      {/* Task summary */}
      {task && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1 font-semibold font-sans">Submitting work for</p>
          <h2 className="font-heading font-semibold text-white tracking-wide">{task.title}</h2>
          <p className="text-sm text-white/50 mt-1 line-clamp-2 font-sans">{task.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs">
            <span className="font-mono text-[#0ea5e9]">
              {formatGen(task.escrow_remaining_wei)} GEN bounty
            </span>
            <span className="text-white/45">Score {task.payout_threshold}+ to win</span>
            <span className="text-white/45">Due {formatDeadline(task.deadline)}</span>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#sw-grad)" strokeWidth={1.8}>
              <defs>
                <linearGradient id="sw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-white tracking-wide">Submit Your Work</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Work URL</label>
            <input
              type="url"
              value={workUrl}
              onChange={e => setWorkUrl(e.target.value)}
              placeholder="https://github.com/yourrepo or link to your work"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you built and how it meets the criteria..."
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors resize-none font-sans text-sm"
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
                {submitStatus || 'Submitting...'}
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
