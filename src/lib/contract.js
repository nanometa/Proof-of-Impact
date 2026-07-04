/**
 * GenLayer ProofOfImpact contract client.
 *
 * Addresses can be injected at build time:
 * - VITE_TASK_MANAGER_ADDRESS
 * - VITE_PROOF_OF_IMPACT_ADDRESS
 * - VITE_GLOBAL_LEADERBOARD_ADDRESS
 */
import { createAccount, createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import { custom } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const CONTRACT_ADDRESS =
  import.meta.env.VITE_PROOF_OF_IMPACT_ADDRESS ||
  '0x8D8117828E401bB674295963e0acbB4C7Af257bc'

const TASK_MANAGER_CONTRACT =
  import.meta.env.VITE_TASK_MANAGER_ADDRESS ||
  '0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc'

const LEADERBOARD_CONTRACT =
  import.meta.env.VITE_GLOBAL_LEADERBOARD_ADDRESS ||
  '0x0EB4407460b232cB5BAC868f1296641419Fc3711'

const EXPLORER_BASE = 'https://explorer-bradbury.genlayer.com/tx'
const DATA_MODE = 'genlayer'
const POLL_INTERVAL = 3000
const MAX_TIMEOUT = 600000

export { CONTRACT_ADDRESS, DATA_MODE, EXPLORER_BASE, LEADERBOARD_CONTRACT, TASK_MANAGER_CONTRACT }

let walletAddress = null
let signingClient = null
let signingAccount = null
let readClient = null

function getSigningAccount() {
  if (signingAccount) return signingAccount

  let pk = localStorage.getItem('gl_burner_pk')
  if (!pk) {
    pk = generatePrivateKey()
    localStorage.setItem('gl_burner_pk', pk)
  }

  signingAccount = privateKeyToAccount(pk)
  return signingAccount
}

export function getBurnerAddress() {
  return getSigningAccount()?.address
}

function getSigningClient() {
  if (typeof window !== 'undefined' && window.ethereum && walletAddress) {
    return createClient({
      chain: testnetBradbury,
      account: walletAddress,
      transport: custom(window.ethereum),
    })
  }

  if (signingClient) return signingClient

  signingClient = createClient({
    chain: testnetBradbury,
    account: getSigningAccount(),
  })
  return signingClient
}

function getReadClient() {
  if (readClient) return readClient

  readClient = createClient({
    chain: testnetBradbury,
    account: signingAccount || createAccount(),
  })
  return readClient
}

export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  walletAddress = accounts[0]
  getSigningClient()
  return walletAddress
}

export function getWalletAddress() {
  return walletAddress
}

export function isConnected() {
  return !!walletAddress
}

export function setWalletAddress(addr) {
  walletAddress = addr || null
  if (addr) getSigningClient()
}

export function disconnect() {
  walletAddress = null
  signingClient = null
  signingAccount = null
  readClient = null
}

if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on?.('accountsChanged', (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnect()
      window.location.reload()
      return
    }
    setWalletAddress(accounts[0])
  })
}

export async function createTask(title, description, criteria, rewardPoints) {
  ensureConnected()
  const client = getSigningClient()
  const taskAddress = TASK_MANAGER_CONTRACT !== ZERO_ADDRESS ? TASK_MANAGER_CONTRACT : CONTRACT_ADDRESS

  try {
    const hash = await client.writeContract({
      address: taskAddress,
      functionName: 'create_task',
      args: [title, description, criteria, Number(rewardPoints)],
    })
    return await pollTx(hash)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function submitWork(taskId, workUrl, description) {
  ensureConnected()
  const client = getSigningClient()

  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: 'submit_work',
      args: [taskId, workUrl, description],
    })
    return await pollTx(hash)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function evaluateSubmission(subId) {
  ensureConnected()
  const client = getSigningClient()

  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: 'evaluate_submission',
      args: [subId],
    })
    const result = await pollTx(hash)
    cacheEvaluationFromReceipt(subId, result.receipt)
    return result
  } catch (e) {
    throw new Error(extractError(e))
  }
}

function cacheEvaluationFromReceipt(subId, receipt) {
  try {
    const resultJson =
      receipt?.consensus_data?.leader_receipt?.[0]?.result?.raw ||
      receipt?.consensus_data?.leader_receipt?.[0]?.result ||
      receipt?.returnValue ||
      receipt?.result

    if (typeof resultJson === 'string') {
      localStorage.setItem(`gl_eval_${subId}`, JSON.stringify(JSON.parse(resultJson)))
    }
  } catch (e) {
    console.warn('[GenLayer] Could not cache evaluation result:', e.message)
  }
}

export function getCachedEvaluation(subId) {
  try {
    const raw = localStorage.getItem(`gl_eval_${subId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function pollTx(hash) {
  const client = getSigningClient()
  const start = Date.now()

  while (Date.now() - start < MAX_TIMEOUT) {
    try {
      const tx = await client.getTransaction({ hash })
      if (tx?.statusName === 'FINALIZED' || tx?.statusName === 'ACCEPTED') {
        return { hash, receipt: tx }
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }

  throw new Error('Consensus is taking longer than expected. Try again shortly.')
}

const cache = new Map()
const CACHE_TTL = 30_000

function getCached(key) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.val
  cache.delete(key)
  return undefined
}

function setCache(key, val) {
  cache.set(key, { val, ts: Date.now() })
  return val
}

async function safeReadFrom(address, fn, args = []) {
  const cacheKey = `${address}:${fn}:${JSON.stringify(args)}`
  const cached = getCached(cacheKey)
  if (cached !== undefined) return cached

  try {
    const result = await getReadClient().readContract({
      address,
      functionName: fn,
      args,
    })
    return setCache(cacheKey, result)
  } catch (e) {
    console.warn(`[GenLayer] read ${fn} failed:`, e.message)
    return null
  }
}

async function safeProofRead(fn, args = []) {
  return safeReadFrom(CONTRACT_ADDRESS, fn, args)
}

async function safeTaskRead(fn, args = []) {
  const taskAddress = TASK_MANAGER_CONTRACT !== ZERO_ADDRESS ? TASK_MANAGER_CONTRACT : CONTRACT_ADDRESS
  return safeReadFrom(taskAddress, fn, args)
}

function parseResult(value) {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  if (value instanceof Map) return Object.fromEntries(value)
  return value
}

export async function getTask(taskId) {
  return parseResult(await safeTaskRead('get_task', [taskId]))
}

export async function getSubmission(subId) {
  return parseResult(await safeProofRead('get_submission', [subId]))
}

export async function getScore(subId) {
  const result = await safeProofRead('get_score', [subId])
  return result != null ? Number(result) : 0
}

export async function getLeaderboardScore(addr) {
  const result = await safeProofRead('get_leaderboard_score', [addr])
  return result != null ? Number(result) : 0
}

export async function getTaskCount() {
  const result = await safeTaskRead('get_task_count')
  return result != null ? Number(result) : 0
}

export async function getSubmissionCount() {
  const result = await safeProofRead('get_submission_count')
  return result != null ? Number(result) : 0
}

export async function loadAllTasks() {
  const count = await getTaskCount()
  if (!count) return []

  const tasks = await Promise.all(
    Array.from({ length: count }, (_, index) => getTask(`task-${index}`).catch(() => null)),
  )
  return tasks.filter(Boolean)
}

export async function loadSubmissionsForTask(taskId) {
  const count = await getSubmissionCount()
  if (!count) return []

  const submissions = await Promise.all(
    Array.from({ length: count }, (_, index) => getSubmission(`sub-${index}`).catch(() => null)),
  )
  return submissions.filter((submission) => submission && submission.task_id === taskId)
}

export async function getAllLeaderboardEntries() {
  if (LEADERBOARD_CONTRACT !== ZERO_ADDRESS) {
    try {
      const raw = await getReadClient().readContract({
        address: LEADERBOARD_CONTRACT,
        functionName: 'get_all_entries',
        args: [],
      })
      const result = parseResult(raw)
      if (Array.isArray(result)) return result
      if (typeof result === 'string') return JSON.parse(result)
    } catch (e) {
      console.warn('[Leaderboard] get_all_entries failed, falling back:', e.message)
    }
  }

  return await scrapeLeaderboardFromSubmissions()
}

export async function getLeaderboardTop(n = 10) {
  const all = await getAllLeaderboardEntries()
  return all.slice(0, n)
}

export async function getLeaderboardContributorCount() {
  if (LEADERBOARD_CONTRACT !== ZERO_ADDRESS) {
    try {
      const result = await getReadClient().readContract({
        address: LEADERBOARD_CONTRACT,
        functionName: 'get_contributor_count',
        args: [],
      })
      return result != null ? Number(result) : 0
    } catch {}
  }

  const all = await getAllLeaderboardEntries()
  return all.length
}

async function scrapeLeaderboardFromSubmissions() {
  const count = await getSubmissionCount()
  if (!count) return []

  const submissions = await Promise.all(
    Array.from({ length: count }, (_, index) => getSubmission(`sub-${index}`).catch(() => null)),
  )
  const evaluated = submissions
    .map((submission, index) => (submission?.status === 'evaluated' ? { submission, index } : null))
    .filter(Boolean)

  if (!evaluated.length) return []

  const scores = await Promise.all(
    evaluated.map(({ index }) => getScore(`sub-${index}`).catch(() => 0)),
  )

  const scoreMap = {}
  evaluated.forEach(({ submission }, index) => {
    const score = scores[index]
    if (!score || !submission.worker) return

    const worker = submission.worker.toLowerCase()
    scoreMap[worker] = (scoreMap[worker] || 0) + score
  })

  return Object.entries(scoreMap)
    .map(([address, score]) => ({ address, score }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function ensureConnected() {
  if (!walletAddress) {
    throw new Error('Wallet not connected. Click Connect Wallet first.')
  }
}

function extractError(error) {
  const message = error?.message || String(error)

  if (message.includes('does not have enough funds')) {
    return `Your signing wallet needs GEN tokens for gas fees. Burner address: ${getBurnerAddress()}`
  }

  const match = message.match(/UserError:\s*(.*)/)
  if (match) return match[1]
  if (message.length > 140) return `${message.substring(0, 140)}...`
  return message
}
