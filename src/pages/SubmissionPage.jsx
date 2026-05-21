import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSubmission, evaluateSubmission, getScore, getCachedEvaluation } from '../lib/contract'
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
        const cached = getCachedEvaluation(subId)
        if (cached) setEvaluation(cached)
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red">Submission not found</p>
      </div>
    )
  }

  const isEvaluated = submission.status === 'evaluated'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/task/${submission.task_id}`} className="inline-flex items-center text-sm text-muted hover:text-text mb-6 transition-colors">
        ← Back to Task
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
    <div className="bg-surface border border-border rounded-xl p-6">
      <h2 className="font-heading text-xl font-bold text-text mb-4">Submission</h2>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Work URL</p>
          <a href={submission.work_url} target="_blank" rel="noopener noreferrer" className="text-purple hover:text-purple/80 underline break-all">
            {submission.work_url}
          </a>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Description</p>
          <p className="text-text/80">{submission.description}</p>
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
                  <div className="w-6 h-6 rounded-full bg-green/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 flex items-center justify-center"><Spinner size="sm" /></div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-border" />
                )}
                <span className={`text-sm ${isActive ? 'text-text' : 'text-muted'}`}>{step}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <button onClick={onEvaluate} className="w-full py-3 rounded-lg bg-purple hover:bg-purple/80 text-white font-medium transition-colors">
          Request AI Evaluation
        </button>
      )}
    </div>
  )
}

function EvaluatedView({ submission, score, evaluation }) {
  // Use evaluation from cache if available, fallback to score from chain
  const finalScore = evaluation?.score ?? score ?? 0
  const grade = evaluation?.grade ?? deriveGrade(finalScore)
  const feedback = evaluation?.feedback
  const strengths = evaluation?.strengths || []
  const improvements = evaluation?.improvements || []
  const criteriaScores = evaluation?.criteria_scores || {}

  return (
    <div className="space-y-6">
      {/* Score and grade */}
      <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center">
        <ScoreCircle score={finalScore} size={120} />
        <div className="mt-4">
          <GradeBadge grade={grade} size="md" />
        </div>
      </div>

      {/* Submission details */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-text mb-3">Work Submitted</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Work URL</p>
            <a href={submission.work_url} target="_blank" rel="noopener noreferrer" className="text-purple hover:text-purple/80 underline break-all">
              {submission.work_url}
            </a>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Description</p>
            <p className="text-text/80">{submission.description}</p>
          </div>
        </div>
      </div>

      {/* Feedback (only if cached eval available) */}
      {feedback ? (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-3">Feedback</h3>
          <blockquote className="border-l-2 border-purple pl-4 text-text/80 italic">
            {feedback}
          </blockquote>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted">
            Detailed feedback was generated during evaluation but is only stored on-chain in the transaction.
            <br />
            <span className="text-xs">Score: <span className="font-mono text-text">{finalScore}/100</span></span>
          </p>
        </div>
      )}

      {/* Strengths & Improvements */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-green mb-3">Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text/80">
                  <svg className="w-4 h-4 text-green mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-orange mb-3">Improvements</h3>
            <ul className="space-y-2">
              {improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text/80">
                  <svg className="w-4 h-4 text-orange mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Criteria Scores</h3>
          <div className="space-y-3">
            {Object.entries(criteriaScores).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted capitalize">{key}</span>
                  <span className="font-mono text-text">{value}/100</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: getScoreColor(value) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified badge */}
      <div className="flex items-center justify-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple/10 border border-purple/30">
          <svg className="w-4 h-4 text-purple" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-purple font-medium">Verified by GenLayer consensus</span>
        </div>
      </div>
    </div>
  )
}
