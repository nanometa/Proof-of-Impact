import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createTask, getTaskCount, waitForTaskCount } from '../lib/contract'
import { useToast } from '../context/ToastContext'
import { PAYOUT_NETWORKS, TASK_TEMPLATES, getTaskTemplate } from '../lib/taskProfiles'
import Spinner from '../components/Spinner'

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [taskTemplate, setTaskTemplate] = useState('code')
  const [payoutChainId, setPayoutChainId] = useState(String(PAYOUT_NETWORKS[0].chainId))
  const [rewardPoints, setRewardPoints] = useState('100')
  const [bountyGen, setBountyGen] = useState('0.01')
  const [payoutThreshold, setPayoutThreshold] = useState('70')
  const [durationDays, setDurationDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !criteria.trim()) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    const points = Number(rewardPoints)
    const bounty = Number(bountyGen)
    const threshold = Number(payoutThreshold)
    const days = Number(durationDays)
    const selectedNetwork = PAYOUT_NETWORKS.find(
      (network) => network.chainId === Number(payoutChainId),
    )

    if (!Number.isInteger(points) || points < 1) {
      addToast({ type: 'error', message: 'Reward points must be a positive integer' })
      return
    }
    if (!Number.isFinite(bounty) || bounty <= 0) {
      addToast({ type: 'error', message: 'A positive GEN bounty is required' })
      return
    }
    if (!Number.isInteger(threshold) || threshold < 50 || threshold > 100) {
      addToast({ type: 'error', message: 'The payout threshold must be between 50 and 100' })
      return
    }
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      addToast({ type: 'error', message: 'The task duration must be between 1 and 30 days' })
      return
    }
    if (!selectedNetwork) {
      addToast({ type: 'error', message: 'Choose a supported ETH testnet rail' })
      return
    }

    setLoading(true)
    setSubmitStatus(`Locking GEN bounty and recording ${selectedNetwork.name} ETH rail...`)
    try {
      const previousCount = await getTaskCount().catch(() => 0)
      const result = await createTask(
        title.trim(),
        description.trim(),
        criteria.trim(),
        points,
        bountyGen,
        threshold,
        days * 24 * 60 * 60,
        taskTemplate,
        Number(payoutChainId),
      )
      if (result.hash) {
        setSubmitStatus('Syncing on-chain task...')
        const nextCount = await waitForTaskCount(previousCount)
        const newTaskId = nextCount > previousCount ? `task-${nextCount - 1}` : null
        addToast({ type: 'success', message: 'Task created successfully!', txHash: result.hash })
        navigate(newTaskId ? `/task/${newTaskId}` : '/app')
      }
    } catch (e) {
      addToast({ type: 'error', message: e.message || 'Failed to create task' })
    } finally {
      setLoading(false)
      setSubmitStatus('')
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
        <p className="text-sm text-white/50 mb-8 ml-[52px] font-sans">Fund verifiable work with an on-chain GEN bounty.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Review Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TASK_TEMPLATES.map((template) => (
                <button
                  type="button"
                  key={template.key}
                  onClick={() => {
                    setTaskTemplate(template.key)
                    if (!criteria.trim()) setCriteria(template.criteria)
                  }}
                  className={`px-3 py-2 rounded-xl border text-left transition-all ${
                    taskTemplate === template.key
                      ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/60 text-white'
                      : 'bg-white/5 border-white/10 text-white/55 hover:text-white hover:border-white/25'
                  }`}
                >
                  <span className="block text-sm font-semibold">{template.shortLabel}</span>
                  <span className="block text-[11px] mt-1 text-white/40 line-clamp-2">{template.focus}</span>
                </button>
              ))}
            </div>
          </div>

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

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/40 flex items-center justify-center shrink-0 text-[#8B5CF6] text-sm font-bold">
                {getTaskTemplate(taskTemplate).shortLabel.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm text-white font-semibold">{getTaskTemplate(taskTemplate).label} evidence profile</p>
                <p className="text-xs text-white/55 mt-1 leading-relaxed">{getTaskTemplate(taskTemplate).evidence}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">GEN Bounty</label>
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                value={bountyGen}
                onChange={e => setBountyGen(e.target.value)}
                placeholder="0.01"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Reward Points</label>
              <input
                type="number"
                min="1"
                step="1"
                value={rewardPoints}
                onChange={e => setRewardPoints(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Winning Score</label>
              <input
                type="number"
                min="50"
                max="100"
                step="1"
                value={payoutThreshold}
                onChange={e => setPayoutThreshold(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Duration (days)</label>
              <input
                type="number"
                min="1"
                max="30"
                step="1"
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">ETH Testnet Rail</label>
            <select
              value={payoutChainId}
              onChange={e => setPayoutChainId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#8B5CF6]/50 focus:bg-white/10 transition-colors font-sans text-sm"
            >
              {PAYOUT_NETWORKS.map((network) => (
                <option className="bg-[#111827] text-white" key={network.chainId} value={network.chainId}>
                  {network.name} — {network.nativeToken} testnet
                </option>
              ))}
            </select>
            <p className="text-xs text-white/40 mt-2 leading-relaxed">
              GenLayer still performs the AI consensus and canonical escrow settlement. The selected ETH testnet rail is recorded on-chain so tasks are no longer generic or single-network.
            </p>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 rounded-xl">
            <svg className="w-4 h-4 text-[#0ea5e9] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-white/60 leading-relaxed">
              The bounty is locked in the TaskManager contract. It is paid once to the first submission reaching the winning score, or returned after the deadline and 24-hour settlement window.
              The selected review template tells validators which evidence to require.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full heroSecondary text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                {submitStatus || 'Creating Task...'}
              </>
            ) : (
              'Lock GEN & Create Task'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
