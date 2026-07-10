import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getSubmission,
  evaluateSubmission,
  getScore,
  getSubmissionEvaluation,
  getCachedEvaluation,
} from '../lib/contract'
import { useWallet } from '../context/WalletContext'
import { useToast } from '../context/ToastContext'
import { getScoreColor } from '../lib/utils'
import ScoreCircle from '../components/ScoreCircle'
import GradeBadge from '../components/GradeBadge'
import Spinner from '../components/Spinner'

const EVAL_STEPS = [
  'Sending to GenLayer validators...',
  'AI analysts scoring your work...',
  'Reaching consensus across validators...',
  'Storing verdict on-chain...',
]

function deriveGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export default function SubmissionPage() {
  const { subId } = useParams()
  const { isConnected, connect } = useWallet()
  const { addToast } = useToast()

  const [submission, setSubmission] = useState(null)
  const [score, setScore] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  async function loadAll() {
    setLoading(true)
    try {
      const sub = await getSubmission(subId)
      setSubmission(sub)

      if (sub?.status === 'evaluated') {
        const s = await getScore(subId)
        setScore(s)
        const onchainEvaluation = await getSubmissionEvaluation(subId)
        const hasOnchainEvaluation =
          onchainEvaluation && Object.keys(onchainEvaluation).length > 0
        const cached = getCachedEvaluation(subId)
        setEvaluation(hasOnchainEvaluation ? onchainEvaluation : cached)
      }
    } catch (e) {
      console.error('Failed to load submission:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [subId])

  async function handleEvaluate() {
    if (!isConnected) {
      await connect()
      return
    }
    setEvaluating(true)
    setCurrentStep(1)

    // Animate steps
    const stepTimer = setInterval(() => {
      setCurrentStep(s => Math.min(s + 1, 4))
    }, 8000)

    try {
      const result = await evaluateSubmission(subId)
      clearInterval(stepTimer)
      setCurrentStep(4)

      if (result.hash) {
        addToast({ type: 'success', message: 'Evaluation complete!', txHash: result.hash })
        await loadAll()
      }
    } catch (e) {
      clearInterval(stepTimer)
      addToast({ type: 'error', message: e.message || 'Evaluation failed' })
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="lg" />
        <p className="text-white/60 text-sm">Loading submission...</p>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm text-center">
          Submission not found
        </div>
      </div>
    )
  }

  const isEvaluated = submission.status === 'evaluated'

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 pb-16 fade-in-up">
      <Link to={`/task/${submission.task_id}`} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Task
      </Link>

      {isEvaluated ? (
        <EvaluatedView submission={submission} score={score} evaluation={evaluation} />
      ) : (
        <PendingView
          submission={submission}
          evaluating={evaluating}
          currentStep={currentStep}
          onEvaluate={handleEvaluate}
        />
      )}
    </div>
  )
}

function PendingView({ submission, evaluating, currentStep, onEvaluate }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#pv-grad)" strokeWidth={1.8}>
            <defs>
              <linearGradient id="pv-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333ea"/>
                <stop offset="100%" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-white tracking-wide">Submission</h2>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold font-sans">Work URL</p>
          <a href={submission.work_url} target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 underline break-all text-sm font-mono">
            {submission.work_url}
          </a>
        </div>
        <div>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold font-sans">Description</p>
          <p className="text-white/70 text-sm font-sans leading-relaxed">{submission.description}</p>
        </div>
      </div>

      {evaluating ? (
        <div className="space-y-3">
          {EVAL_STEPS.map((step, i) => {
            const stepNum = i + 1
            const isActive = currentStep >= stepNum
            const isDone = currentStep > stepNum
            return (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                {isDone ? (
                  <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-7 h-7 flex items-center justify-center"><Spinner size="sm" /></div>
                ) : (
                  <div className="w-7 h-7 rounded-full border border-white/10" />
                )}
                <span className={`text-sm font-sans ${isActive ? 'text-white' : 'text-white/40'}`}>{step}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <button onClick={onEvaluate} className="w-full py-3.5 rounded-full heroSecondary text-sm font-semibold transition-all">
          Request AI Evaluation
        </button>
      )}
    </div>
  )
}

function EvaluatedView({ submission, score, evaluation }) {
  // Prefer the on-chain evaluation and use the cached receipt as a fallback.
  const finalScore = evaluation?.score ?? score ?? 0
  const grade = evaluation?.grade ?? deriveGrade(finalScore)
  const feedback = evaluation?.feedback
  const strengths = evaluation?.strengths || []
  const improvements = evaluation?.improvements || []
  const criteriaScores = evaluation?.criteria_scores || {}

  return (
    <div className="space-y-6">
      {/* Score and grade */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center">
        <ScoreCircle score={finalScore} size={120} />
        <div className="mt-4">
          <GradeBadge grade={grade} size="md" />
        </div>
      </div>

      {/* Submission details */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="font-heading font-semibold text-white mb-4 tracking-wide">Work Submitted</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold font-sans">Work URL</p>
            <a href={submission.work_url} target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 underline break-all font-mono">
              {submission.work_url}
            </a>
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold font-sans">Description</p>
            <p className="text-white/70 font-sans leading-relaxed">{submission.description}</p>
          </div>
        </div>
      </div>

      {/* Feedback (only if cached eval available) */}
      {feedback ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="font-heading font-semibold text-white mb-4 tracking-wide">Feedback</h3>
          <blockquote className="border-l-2 border-[#8B5CF6]/50 pl-4 text-white/70 italic font-sans leading-relaxed">
            {feedback}
          </blockquote>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm text-white/50 font-sans">
            Detailed feedback could not be loaded from the contract. Refresh to retry.
            <br />
            <span className="text-xs">Score: <span className="font-mono text-white">{finalScore}/100</span></span>
          </p>
        </div>
      )}

      {/* Strengths & Improvements */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-[#8B5CF6] mb-3 tracking-wide">Strengths</h3>
            <ul className="space-y-2.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70 font-sans">
                  <svg className="w-4 h-4 text-[#8B5CF6] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-[#0ea5e9] mb-3 tracking-wide">Improvements</h3>
            <ul className="space-y-2.5">
              {improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70 font-sans">
                  <svg className="w-4 h-4 text-[#0ea5e9] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Criteria scores */}
      {Object.keys(criteriaScores).length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="font-heading font-semibold text-white mb-5 tracking-wide">Criteria Scores</h3>
          <div className="space-y-4">
            {Object.entries(criteriaScores).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-white/50 capitalize font-sans">{key}</span>
                  <span className="font-mono text-white">{value}/100</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #8b5cf6, #0ea5e9)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified badge */}
      <div className="flex items-center justify-center py-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
          <svg className="w-4 h-4 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-[#8B5CF6] font-medium font-sans">Verified by GenLayer consensus</span>
        </div>
      </div>
    </div>
  )
}
