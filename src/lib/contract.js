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
const READ_RETRIES = 3
const RATE_LIMIT_DELAY = 1500

export { CONTRACT_ADDRESS, DATA_MODE, EXPLORER_BASE, LEADERBOARD_CONTRACT, TASK_MANAGER_CONTRACT }

let walletAddress = null
let signingClient = null
let signingAccount = null
let readClient = null

function getEthereumProvider() {
  if (typeof window === 'undefined') return null

  try {
    const provider = window.ethereum
    if (!provider) return null

    if (Array.isArray(provider.providers) && provider.providers.length > 0) {
      return provider.providers.find((item) => item?.isMetaMask) || provider.providers[0]
    }

    return provider
  } catch {
    return null
  }
}

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
  const ethereum = getEthereumProvider()
  if (ethereum && walletAddress) {
    return createClient({
      chain: testnetBradbury,
      account: walletAddress,
      transport: custom(ethereum),
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
  const ethereum = getEthereumProvider()
  if (!ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
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

const ethereumProvider = getEthereumProvider()
if (ethereumProvider) {
  ethereumProvider.on?.('accountsChanged', (accounts) => {
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
    clearReadCache()
    const hash = await client.writeContract({
      address: taskAddress,
      functionName: 'create_task',
      args: [title, description, criteria, Number(rewardPoints)],
    })
    const result = await pollTx(hash)
    clearReadCache()
    return result
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function submitWork(taskId, workUrl, description) {
  ensureConnected()
  const client = getSigningClient()

  try {
    clearReadCache()
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: 'submit_work',
      args: [taskId, workUrl, description],
    })
    const result = await pollTx(hash)
    clearReadCache()
    return result
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function evaluateSubmission(subId) {
  ensureConnected()
  const client = getSigningClient()

  try {
    clearReadCache()
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: 'evaluate_submission',
      args: [subId],
    })
    const result = await pollTx(hash)
    cacheEvaluationFromReceipt(subId, result.receipt)
    clearReadCache()
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
const CACHE_TTL = 5_000

export function clearReadCache() {
  cache.clear()
}

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

  for (let attempt = 0; attempt <= READ_RETRIES; attempt += 1) {
    try {
      const result = await getReadClient().readContract({
        address,
        functionName: fn,
        args,
      })
      return setCache(cacheKey, result)
    } catch (e) {
      const message = e?.message || String(e)
      const canRetry = /rate limit|limit exceeded|request exceeds/i.test(message)

      if (canRetry && attempt < READ_RETRIES) {
        await sleep(RATE_LIMIT_DELAY * (attempt + 1))
        continue
      }

      console.warn(`[GenLayer] read ${fn} failed:`, message)
      return null
    }
  }

  return null
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

export async function loadAllTasks(countOverride = null) {
  const count = countOverride != null ? Number(countOverride) : await getTaskCount()
  if (!count) return []

  const tasks = []
  for (let index = 0; index < count; index += 1) {
    const task = await getTask(`task-${index}`).catch(() => null)
    if (task) tasks.push(task)
    if (index < count - 1) await sleep(250)
  }

  return tasks
}

function normalizeSubmissionIds(raw) {
  const parsed = parseResult(raw)
  const list = Array.isArray(parsed) ? parsed : []

  return list
    .map((item) => String(item || '').trim())
    .filter((item) => /^sub-\d+$/.test(item))
}

export async function loadSubmissionIdsForTask(taskId) {
  return normalizeSubmissionIds(await safeTaskRead('get_task_submissions', [taskId]))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForTaskSubmissions(taskId, previousIds = [], timeoutMs = 45_000) {
  const previous = new Set(previousIds)
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    clearReadCache()
    const ids = await loadSubmissionIdsForTask(taskId)
    const hasNewId = ids.some((id) => !previous.has(id))

    if (ids.length > previousIds.length || hasNewId) return ids
    await sleep(2_500)
  }

  clearReadCache()
  return loadSubmissionIdsForTask(taskId)
}

export async function waitForTaskCount(previousCount = 0, timeoutMs = 45_000) {
  const target = Number(previousCount)
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    clearReadCache()
    const count = await getTaskCount()

    if (count > target) return count
    await sleep(2_500)
  }

  clearReadCache()
  return getTaskCount()
}

export async function loadSubmissionsForTask(taskId) {
  const ids = await loadSubmissionIdsForTask(taskId)

  if (ids.length) {
    const submissions = []
    for (const id of ids) {
      const submission = await getSubmission(id).catch(() => null)
      if (submission) submissions.push(submission)
      await sleep(250)
    }
    const fromTaskManager = submissions.filter(
      (submission) => submission && submission.task_id === taskId,
    )
    if (fromTaskManager.length) return fromTaskManager
  }

  const count = await getSubmissionCount()
  if (!count) return []

  const submissions = []
  for (let index = 0; index < count; index += 1) {
    const submission = await getSubmission(`sub-${index}`).catch(() => null)
    if (submission) submissions.push(submission)
    if (index < count - 1) await sleep(250)
  }

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

  const submissions = []
  for (let index = 0; index < count; index += 1) {
    const submission = await getSubmission(`sub-${index}`).catch(() => null)
    if (submission) submissions.push({ submission, subId: `sub-${index}` })
    if (index < count - 1) await sleep(250)
  }

  const evaluated = submissions
    .filter(({ submission }) => submission?.status === 'evaluated')
    .filter(Boolean)

  if (!evaluated.length) return []

  const scores = await Promise.all(
    evaluated.map(({ subId }) => getScore(subId).catch(() => 0)),
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
