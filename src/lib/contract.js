/**
 * GenLayer ProofOfImpact Contract Client (genlayer-js v1.1.8)
 *
 * Hybrid wallet flow:
 *   - MetaMask → connect & display user's address in UI (identity only)
 *   - createAccount() → used internally for writeContract signing
 *     → produces eth_sendRawTransaction → Type: "Call" ✅
 *
 * Contract: 0x9C474912AE818070fADA725324A8a7ad7e002fD3
 * Network: GenLayer Bradbury Testnet (Chain ID 4221)
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const CONTRACT_ADDRESS = "0xD931392177067735378b26e5EE37851284c19d69";
// GlobalLeaderboard contract — stores all contributors, readable without wallet
// Deploy this contract via GenLayer Studio and paste address here
const LEADERBOARD_CONTRACT = "0x0000000000000000000000000000000000000000"; // TODO: replace after deploy
const EXPLORER_BASE = "https://explorer-bradbury.genlayer.com/tx";
const POLL_INTERVAL = 3000;
const MAX_TIMEOUT = 120000;

export { CONTRACT_ADDRESS, EXPLORER_BASE };

// User's MetaMask address
let walletAddress = null;

import { custom } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Internal signing client
let signingClient = null;
let signingAccount = null;

function getSigningAccount() {
  if (signingAccount) return signingAccount;
  let pk = localStorage.getItem('gl_burner_pk');
  if (!pk) {
    pk = generatePrivateKey();
    localStorage.setItem('gl_burner_pk', pk);
  }
  signingAccount = privateKeyToAccount(pk);
  return signingAccount;
}

export function getBurnerAddress() {
  return getSigningAccount()?.address;
}

function getSigningClient() {
  // If user connected MetaMask, use it directly!
  if (typeof window !== "undefined" && window.ethereum && walletAddress) {
    return createClient({
      chain: testnetBradbury,
      account: walletAddress,
      transport: custom(window.ethereum),
    });
  }

  // Fallback to burner wallet
  if (signingClient) return signingClient;
  signingClient = createClient({
    chain: testnetBradbury,
    account: getSigningAccount(),
  });
  return signingClient;
}

// Read-only client (no signing needed)
let readClient = null;
function getReadClient() {
  if (readClient) return readClient;
  readClient = createClient({
    chain: testnetBradbury,
    account: signingAccount || createAccount(),
  });
  return readClient;
}

// ═══════════════ WALLET CONNECT (MetaMask = UI only) ═══════════════
export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  console.log("[GenLayer] Requesting MetaMask accounts...");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  walletAddress = accounts[0];
  console.log("[GenLayer] User address (UI):", walletAddress);
  // Pre-init signing client so first tx is fast
  getSigningClient();
  return walletAddress;
}

export function getWalletAddress() { return walletAddress; }
export function isConnected() { return !!walletAddress; }
export function setWalletAddress(addr) {
  walletAddress = addr;
  if (addr) {
    getSigningClient();
  }
}
export function disconnect() {
  walletAddress = null;
  signingClient = null;
  signingAccount = null;
  readClient = null;
}

// Listen for MetaMask account changes / disconnects
if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on?.("accountsChanged", (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnect();
      window.location.reload();
    }
  });
}

// ═══════════════ WRITE (signed by createAccount → Type: Call) ═══════════════
export async function createTask(title, description, criteria, rewardPoints) {
  ensureConnected();
  const client = getSigningClient();
  console.log("[GenLayer] create_task:", { title, description, criteria, rewardPoints: Number(rewardPoints) });
  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "create_task",
      args: [title, description, criteria, Number(rewardPoints)],
    });
    console.log("[GenLayer] TX hash:", hash);
    return await pollTx(hash);
  } catch (e) {
    console.error("[GenLayer] createTask error:", e);
    throw new Error(extractError(e));
  }
}

export async function submitWork(taskId, workUrl, description) {
  ensureConnected();
  const client = getSigningClient();
  console.log("[GenLayer] submit_work:", { taskId, workUrl, description });
  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "submit_work",
      args: [taskId, workUrl, description],
    });
    console.log("[GenLayer] TX hash:", hash);
    return await pollTx(hash);
  } catch (e) {
    console.error("[GenLayer] submitWork error:", e);
    throw new Error(extractError(e));
  }
}

export async function evaluateSubmission(subId) {
  ensureConnected();
  const client = getSigningClient();
  console.log("[GenLayer] evaluate_submission:", { subId });
  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "evaluate_submission",
      args: [subId],
    });
    console.log("[GenLayer] TX hash:", hash);
    const result = await pollTx(hash);

    // Cache evaluation result from tx receipt
    try {
      const tx = result.receipt;
      const resultJson =
        tx?.consensus_data?.leader_receipt?.[0]?.result?.raw ||
        tx?.consensus_data?.leader_receipt?.[0]?.result ||
        tx?.returnValue ||
        tx?.result;
      if (typeof resultJson === "string") {
        const parsed = JSON.parse(resultJson);
        localStorage.setItem(`gl_eval_${subId}`, JSON.stringify(parsed));
        console.log("[GenLayer] Cached eval result for", subId);
      }
    } catch (e) {
      console.warn("[GenLayer] Could not cache eval result:", e.message);
    }

    return result;
  } catch (e) {
    console.error("[GenLayer] evaluate error:", e);
    throw new Error(extractError(e));
  }
}

export function getCachedEvaluation(subId) {
  try {
    const raw = localStorage.getItem(`gl_eval_${subId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function pollTx(hash) {
  const client = getSigningClient();
  const start = Date.now();
  while (Date.now() - start < MAX_TIMEOUT) {
    try {
      const tx = await client.getTransaction({ hash });
      if (tx?.statusName === "FINALIZED" || tx?.statusName === "ACCEPTED") {
        console.log("[GenLayer] ✓ Status:", tx.statusName);
        return { hash, receipt: tx };
      }
    } catch {}
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error("Consensus taking longer, try again");
}

// ═══════════════ CACHE ═══════════════
const _cache = new Map();
const CACHE_TTL = 30_000; // 30s

function getCached(key) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.val;
  _cache.delete(key);
  return undefined;
}

function setCache(key, val) {
  _cache.set(key, { val, ts: Date.now() });
  return val;
}

// ═══════════════ READ ═══════════════
async function safeRead(fn, args = []) {
  const cacheKey = `${CONTRACT_ADDRESS}:${fn}:${JSON.stringify(args)}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;
  try {
    const result = await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: fn,
      args,
    });
    return setCache(cacheKey, result);
  } catch (e) {
    console.warn(`[GenLayer] read ${fn} failed:`, e.message);
    return null;
  }
}

export async function getTask(taskId) { return parseResult(await safeRead("get_task", [taskId])); }
export async function getSubmission(subId) { return parseResult(await safeRead("get_submission", [subId])); }
export async function getScore(subId) { const r = await safeRead("get_score", [subId]); return r != null ? Number(r) : 0; }
export async function getLeaderboardScore(addr) { const r = await safeRead("get_leaderboard_score", [addr]); return r != null ? Number(r) : 0; }
export async function getTaskCount() { const r = await safeRead("get_task_count"); return r != null ? Number(r) : 0; }
export async function getSubmissionCount() { const r = await safeRead("get_submission_count"); return r != null ? Number(r) : 0; }

export async function loadAllTasks() {
  const count = await getTaskCount();
  if (!count) return [];
  const promises = Array.from({ length: count }, (_, i) =>
    getTask(`task-${i}`).catch(() => null)
  );
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

export async function loadSubmissionsForTask(taskId) {
  const count = await getSubmissionCount();
  if (!count) return [];
  const promises = Array.from({ length: count }, (_, i) =>
    getSubmission(`sub-${i}`).catch(() => null)
  );
  const results = await Promise.all(promises);
  return results.filter(s => s && s.task_id === taskId);
}

function ensureConnected() {
  if (!walletAddress) {
    throw new Error("Wallet not connected. Click 'Connect Wallet' first.");
  }
}

function parseResult(r) {
  if (r == null) return null;
  if (typeof r === "string") { try { return JSON.parse(r); } catch { return r; } }
  if (r instanceof Map) return Object.fromEntries(r);
  return r;
}

function extractError(e) {
  let msg = e.message || String(e);
  
  if (msg.includes("does not have enough funds")) {
    const burnerAddress = getBurnerAddress();
    return `Your internal burner wallet (${burnerAddress}) needs GEN tokens for gas fees! Please copy this address and send 1 GEN to it from your MetaMask to continue.`;
  }
  
  const match = msg.match(/UserError:\s*(.*)/);
  if (match) return match[1];
  if (msg.length > 100) return msg.substring(0, 100) + "...";
  return msg;
}

// ═══════════════ GLOBAL LEADERBOARD CONTRACT ═══════════════

export { LEADERBOARD_CONTRACT };

/**
 * Read all entries from the GlobalLeaderboard contract.
 * Returns [{address, score, rank}] sorted descending.
 * No wallet connection needed.
 */
export async function getAllLeaderboardEntries() {
  // If the leaderboard contract is deployed, read from it
  if (LEADERBOARD_CONTRACT !== "0x0000000000000000000000000000000000000000") {
    try {
      const client = getReadClient();
      const raw = await client.readContract({
        address: LEADERBOARD_CONTRACT,
        functionName: "get_all_entries",
        args: [],
      });
      const result = parseResult(raw);
      if (Array.isArray(result)) return result;
      if (typeof result === "string") return JSON.parse(result);
    } catch (e) {
      console.warn("[LeaderboardContract] get_all_entries failed, falling back:", e.message);
    }
  }

  // ── Fallback: scrape all submissions from the main contract ──
  return await scrapeLeaderboardFromSubmissions();
}

export async function getLeaderboardTop(n = 10) {
  const all = await getAllLeaderboardEntries();
  return all.slice(0, n);
}

export async function getLeaderboardContributorCount() {
  if (LEADERBOARD_CONTRACT !== "0x0000000000000000000000000000000000000000") {
    try {
      const client = getReadClient();
      const r = await client.readContract({
        address: LEADERBOARD_CONTRACT,
        functionName: "get_contributor_count",
        args: [],
      });
      return r != null ? Number(r) : 0;
    } catch {}
  }
  const all = await getAllLeaderboardEntries();
  return all.length;
}

/**
 * Fallback: walk all submissions in the main contract,
 * group by worker address, sum their scores → build leaderboard.
 */
async function scrapeLeaderboardFromSubmissions() {
  try {
    const subCount = await getSubmissionCount();
    if (!subCount) return [];

    // Fetch all submissions in parallel
    const subPromises = Array.from({ length: subCount }, (_, i) =>
      getSubmission(`sub-${i}`).catch(() => null)
    );
    const allSubs = await Promise.all(subPromises);

    // Filter to evaluated only, then fetch scores in parallel
    const evaluated = allSubs
      .map((sub, i) => sub && sub.status === "evaluated" ? { sub, idx: i } : null)
      .filter(Boolean);

    if (!evaluated.length) return [];

    const scorePromises = evaluated.map(({ idx }) =>
      getScore(`sub-${idx}`).catch(() => 0)
    );
    const scores = await Promise.all(scorePromises);

    // Build score map
    const scoreMap = {};
    evaluated.forEach(({ sub }, i) => {
      const score = scores[i];
      if (!score) return;
      const worker = (sub.worker || "").toLowerCase();
      if (!worker) return;
      scoreMap[worker] = (scoreMap[worker] || 0) + score;
    });

    const entries = Object.entries(scoreMap)
      .map(([address, score]) => ({ address, score }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return entries;
  } catch (e) {
    console.error("[LeaderboardFallback] scrape failed:", e.message);
    return [];
  }
}
