import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getTask,
  getTaskEscrow,
  getTaskStats,
  loadSubmissionsForTask,
  refundExpiredTask,
} from '../lib/contract'
import { formatDeadline, formatGen, truncateAddress } from '../lib/utils'
import { useWallet } from '../context/WalletContext'
import { useToast } from '../context/ToastContext'
import ScoreCircle from '../components/ScoreCircle'
import Spinner from '../components/Spinner'

export default function TaskPage() {
  const { taskId } = useParams()
  const { isConnected } = useWallet()
  const { addToast } = useToast()
  const [task, setTask] = useState(null)
  const [escrow, setEscrow] = useState(null)
  const [stats, setStats] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [t, taskEscrow, taskStats, subs] = await Promise.all([
          getTask(taskId),
          getTaskEscrow(taskId),
          getTaskStats(taskId),
          loadSubmissionsForTask(taskId),
        ])
        setTask(t)
        setEscrow(taskEscrow)
        setStats(taskStats)
        setSubmissions(subs)
      } catch (e) {
        console.error('Failed to load task:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  async function handleRefund() {
    if (!isConnected) {
      addToast({ type: 'warning', message: 'Connect your wallet from the header first' })
      return
    }

    setRefunding(true)
    try {
      const result = await refundExpiredTask(taskId)
      addToast({
        type: 'success',
        message: 'Expired bounty returned to the task creator',
        txHash: result.hash,
      })
      const [nextTask, nextEscrow, nextStats] = await Promise.all([
        getTask(taskId),
        getTaskEscrow(taskId),
        getTaskStats(taskId),
      ])
      setTask(nextTask)
      setEscrow(nextEscrow)
      setStats(nextStats)
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Refund failed' })
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="lg" />
        <p className="text-white/60 text-sm">Loading task details...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm text-center">
          Task not found
        </div>
      </div>
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const deadline = Number(task.deadline || escrow?.deadline || 0)
  const refundAvailableAt = Number(
    task.refund_available_at || escrow?.refund_available_at || 0,
  )
  const deadlinePassed = deadline > 0 && now > deadline
  const visibleStatus =
    task.status === 'open' && deadlinePassed ? 'expired' : task.status
  const remainingWei = task.escrow_remaining_wei ?? escrow?.remaining_wei ?? '0'
  const pendingCount = Number(stats?.pending_submissions || 0)
  const canRefund =
    task.status === 'open' &&
    refundAvailableAt > 0 &&
    now > refundAvailableAt &&
    pendingCount === 0 &&
    BigInt(remainingWei || 0) > 0n
  const canSubmit = task.status === 'open' && !deadlinePassed

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 pb-16 fade-in-up">
      {/* Back button */}
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tasks
      </Link>

      {/* Task header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between mb-5">
          <h1 className="font-heading text-2xl font-semibold text-white tracking-wide">{task.title}</h1>
          <div className="flex items-center gap-2.5 shrink-0 ml-4">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${
              visibleStatus === 'open'
                ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/50 text-[#8B5CF6]'
                : 'bg-white/5 border border-white/10 text-white/60'
            }`}>
              {visibleStatus}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#0ea5e9] text-[11px] font-bold">
              {formatGen(task.escrow_total_wei ?? escrow?.total_wei)} GEN
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/50 text-[#8B5CF6] text-[11px] font-bold">
              {task.reward_points} pts
            </span>
          </div>
        </div>

        <p className="text-white/70 mb-6 leading-relaxed font-sans">{task.description}</p>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-5">
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2 font-semibold font-sans">Evaluation Criteria</p>
          <p className="text-sm text-white/80 font-sans">{task.criteria}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 py-5 mb-5 border-y border-white/10">
          <div>
            <p className="text-[11px] text-white/35 uppercase mb-1">Escrow</p>
            <p className="font-mono text-sm text-white">
              {formatGen(remainingWei)} GEN remaining
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/35 uppercase mb-1">Winning score</p>
            <p className="font-mono text-sm text-white">{task.payout_threshold ?? escrow?.payout_threshold}/100</p>
          </div>
          <div>
            <p className="text-[11px] text-white/35 uppercase mb-1">Submission deadline</p>
            <p className="text-sm text-white">{formatDeadline(deadline)}</p>
          </div>
        </div>

        {task.winner && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-sm">
            <span className="text-white/50">Winning submission</span>
            <span className="font-mono text-[#0ea5e9]">
              {task.winning_submission} by {truncateAddress(task.winner)}
            </span>
          </div>
        )}

        {canRefund && (
          <button
            type="button"
            onClick={handleRefund}
            disabled={refunding}
            className="mb-5 px-4 py-2.5 border border-[#0ea5e9]/40 text-[#0ea5e9] hover:bg-[#0ea5e9]/10 rounded-lg text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-2"
          >
            {refunding && <Spinner size="sm" />}
            Return expired bounty
          </button>
        )}

        <p className="text-xs text-white/40 font-sans">
          Created by <span className="font-mono text-white/60">{truncateAddress(task.creator)}</span>
        </p>
      </div>

      {/* Submissions section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-semibold text-white tracking-wide">
            Submissions ({submissions.length})
          </h2>
          {canSubmit && (
            <Link
              to={`/task/${taskId}/submit`}
              className="heroSecondary px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Submit Your Work
            </Link>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-white/50 text-sm font-sans">No submissions yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.sub_id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all hover:bg-white/10 hover:border-white/20 duration-300">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-white/60">{truncateAddress(sub.worker)}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                    sub.status === 'evaluated'
                      ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/50 text-[#8B5CF6]'
                      : 'bg-yellow/10 border border-yellow/30 text-yellow'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {sub.status === 'evaluated' && sub.score !== undefined && (
                    <ScoreCircle score={sub.score} size={36} />
                  )}
                  <Link
                    to={`/submission/${sub.sub_id}`}
                    className="text-xs text-[#8B5CF6] hover:text-[#8B5CF6]/80 font-semibold transition-colors"
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
