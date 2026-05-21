/**
 * useContract.js — React hook for ProofOfImpact contract interaction
 * Uses genlayer-js SDK with auto-generated local account (Type: Call ✅)
 */
import { useState, useCallback } from "react";
import {
  createTask as _createTask,
  submitWork as _submitWork,
  evaluateSubmission as _evaluateSubmission,
  getTask,
  getSubmission,
  getScore,
  getLeaderboardScore,
  getTaskCount,
  getSubmissionCount,
  loadAllTasks,
  loadSubmissionsForTask,
  EXPLORER_BASE,
} from "../lib/contract";

export function useContractWrite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const execute = useCallback(async (fn, ...args) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const result = await fn(...args);
      setTxHash(result.hash);
      return result;
    } catch (e) {
      const msg = e?.message || "Transaction failed";
      // Handle known GenLayer errors
      if (msg.includes("execution failed")) {
        setError("Contract execution failed — check your inputs");
      } else if (msg.includes("Invalid transaction")) {
        setError("Invalid transaction data — SDK encoding error");
      } else {
        setError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(
    (title, desc, criteria, points) => execute(_createTask, title, desc, criteria, points),
    [execute]
  );

  const submitWork = useCallback(
    (taskId, url, desc) => execute(_submitWork, taskId, url, desc),
    [execute]
  );

  const evaluateSubmission = useCallback(
    (subId) => execute(_evaluateSubmission, subId),
    [execute]
  );

  return { createTask, submitWork, evaluateSubmission, loading, error, txHash };
}

export function useContractRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const read = useCallback(async (fn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      return result;
    } catch (e) {
      const msg = e?.message || "Read failed";
      if (msg.includes("execution failed")) {
        // Contract might be empty or not deployed — return safe default
        console.warn("Read failed (empty state?):", msg);
        return null;
      }
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    read,
    loading,
    error,
    // Convenience methods with safe defaults
    getTasks: () => read(loadAllTasks).then((r) => r || []),
    getTaskCount: () => read(getTaskCount).then((r) => r || 0),
    getSubmissionCount: () => read(getSubmissionCount).then((r) => r || 0),
    getTask: (id) => read(getTask, id),
    getSubmission: (id) => read(getSubmission, id),
    getScore: (id) => read(getScore, id).then((r) => r || 0),
    getLeaderboard: (addr) => read(getLeaderboardScore, addr).then((r) => r || 0),
    getSubmissionsForTask: (taskId) => read(loadSubmissionsForTask, taskId).then((r) => r || []),
  };
}

export function getTxExplorerUrl(hash) {
  return `${EXPLORER_BASE}/${hash}`;
}
