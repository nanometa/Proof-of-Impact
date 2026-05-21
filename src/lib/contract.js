/**
 * GenLayer ProofOfImpact Contract Client (genlayer-js v1.1.8)
 *
 * Hybrid wallet flow:
 *   - MetaMask → connect & display user's address in UI (identity only)
 *   - createAccount() → used internally for writeContract signing
 *     → produces eth_sendRawTransaction → Type: "Call" ✅
 *
 * Contract: 0xe8edD92871983af27af5bC15edF6A96265e6a689
 * Network: GenLayer Studionet (Chain ID 61999)
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = "0xe8edD92871983af27af5bC15edF6A96265e6a689";
const EXPLORER_BASE = "https://explorer-studio.genlayer.com/tx";
const POLL_INTERVAL = 3000;
const MAX_TIMEOUT = 120000;

export { CONTRACT_ADDRESS, EXPLORER_BASE };

// User's MetaMask address (UI only — not used for signing)
let walletAddress = null;

// Internal signing client — uses an auto-generated account → Type: "Call"
let signingClient = null;
let signingAccount = null;

function getSigningClient() {
  if (signingClient) return signingClient;
  signingAccount = createAccount();
  signingClient = createClient({
    chain: studionet,
    account: signingAccount,
  });
  console.log("[GenLayer] Signing account:", signingAccount.address);
  return signingClient;
}

// Read-only client (no signing needed)
let readClient = null;
function getReadClient() {
  if (readClient) return readClient;
  readClient = createClient({
    chain: studionet,
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

// ═══════════════ READ ═══════════════
async function safeRead(fn, args = []) {
  try {
    return await getReadClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName: fn,
      args,
    });
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
  const tasks = [];
  for (let i = 0; i < count; i++) {
    try { const t = await getTask(`task-${i}`); if (t) tasks.push(t); } catch {}
  }
  return tasks;
}

export async function loadSubmissionsForTask(taskId) {
  const count = await getSubmissionCount();
  if (!count) return [];
  const subs = [];
  for (let i = 0; i < count; i++) {
    try { const s = await getSubmission(`sub-${i}`); if (s && s.task_id === taskId) subs.push(s); } catch {}
  }
  return subs;
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
  const msg = e?.shortMessage || e?.message || String(e);
  if (msg.includes("User rejected")) return "Transaction rejected";
  if (msg.includes("insufficient funds")) return "Signing account has no GEN balance";
  return msg;
}
