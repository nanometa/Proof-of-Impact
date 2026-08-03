<div align="center">

<img src="public/logo.svg" alt="Proof of Impact" width="88" />

# Proof of Impact

**Fund work with real native ETH on L2 testnets, submit verifiable evidence, and let decentralized AI validators score category-specific work against an explicit payout threshold.**

[**Live Demo**](https://proof-of-impact-pi.vercel.app/) - [**Bradbury Explorer**](https://explorer-bradbury.genlayer.com) - [**GenLayer**](https://genlayer.com)

[![Live](https://img.shields.io/badge/Live-proof--of--impact--pi.vercel.app-10b981?style=flat-square&logo=vercel)](https://proof-of-impact-pi.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![Version](https://img.shields.io/badge/ProofOfImpact-v4.3.0-22c55e?style=flat-square)](#current-bradbury-deployment)
[![License](https://img.shields.io/badge/License-MIT-64748b?style=flat-square)](#license)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why It Matters](#why-it-matters)
- [Key Features](#key-features)
- [Current Bradbury Deployment](#current-bradbury-deployment)
- [Verified On-Chain Tests](#verified-on-chain-tests)
- [Architecture](#architecture)
- [How AI Evaluation Works](#how-ai-evaluation-works)
- [Frontend Integration](#frontend-integration)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [GenLayer CLI](#genlayer-cli)
- [Project Structure](#project-structure)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**Proof of Impact** is a decentralized work marketplace built on the
**GenLayer Bradbury Testnet**. A task creator publishes a mission with custom
criteria and locks a native ETH bounty in a dedicated L2 escrow contract.
Contributors submit evidence through a URL, and GenLayer validators use
AI-assisted consensus to score the submission from `0` to `100`.

The result is written on-chain with:

- a numeric score,
- a grade,
- detailed feedback,
- criteria-level scoring,
- risk flags,
- contributor points pushed into a global leaderboard,
- the task's selected review template and ETH testnet escrow,
- and a one-time L2 ETH settlement when the winning threshold is reached.

The project demonstrates a practical GenLayer pattern: smart contracts that can
reason over real-world evidence without depending on a centralized reviewer or a
single oracle.

---

## Why It Matters

Traditional bounty and contribution platforms usually rely on manual review:
slow, subjective, and difficult to audit. Proof of Impact moves the review layer
into an intelligent contract:

| Problem | Proof of Impact approach |
| --- | --- |
| Reviewers are slow | AI validators evaluate directly from the contract |
| Subjective scoring is opaque | score, feedback, and criteria scores are stored on-chain |
| Weak evidence can slip through | AI validators evaluate the fetched evidence against the task criteria |
| Workers have no payment guarantee | native ETH leaves the creator wallet and remains locked in an L2 escrow |
| Leaderboards are off-chain | cumulative impact points are stored in `GlobalLeaderboard` |
| Historical submissions are expensive to scrape | rankings are updated directly by contract writes |

---

## Key Features

- **Real L2 ETH Escrow** - funded tasks lock native ETH in `L2TaskEscrow` on the selected testnet before the GenLayer task is created.
- **Guaranteed Settlement** - the first qualifying submission can release the full bounty; creators cannot withdraw it early.
- **Expiry Protection** - a bounty can be refunded only after the deadline and a 24-hour finalization window.
- **Template-Based Task Marketplace** - create tasks with custom criteria, reward points, payout threshold, deadline, and a specialized review profile.
- **Specialized Review Templates** - code, research, design, community, content, and data tasks each carry their own evidence requirements and risk flags.
- **ETH Testnet Settlement** - creators can fund tasks on Ethereum Sepolia, Base Sepolia, OP Sepolia, or Arbitrum Sepolia with real native ETH escrow.
- **AI-Powered Evaluation** - validators score submissions using task-specific evidence and criteria.
- **Independent Evidence Consensus** - validators independently re-fetch the submitted URL before AI scoring can reach consensus.
- **On-Chain Leaderboard** - contributor points are written to a dedicated leaderboard contract.
- **Detailed Feedback** - every evaluated submission includes strengths, improvements, grade, and risk flags.
- **Three-Contract Architecture** - task lifecycle, evaluation, and rankings are separated cleanly.
- **Public Active Deployment Config** - contract addresses are documented in `src/lib/deployments.js`, with Vite env overrides for custom deployments.
- **Responsive Web App** - React, Vite, TailwindCSS, RainbowKit, wagmi, and genlayer-js.

---

## Current Bradbury Deployment

This README documents the active
`v4.3-l2-eth-escrow` source branch on GenLayer Bradbury
Testnet.

| Contract | Version | Address | Purpose |
| --- | --- | --- | --- |
| `TaskManager` | `4.3.0` | [`0xF4Fa50664E9c61e3a910b796aA702BfA96C8a50D`](https://explorer-bradbury.genlayer.com/address/0xF4Fa50664E9c61e3a910b796aA702BfA96C8a50D) | task creation, templates, external ETH escrow receipts, payout/refund readiness, and accounting |
| `ProofOfImpact` | `4.3.0` | [`0xE872ab6D367669af00CCCd9295CeaA9FcCD2BFCe`](https://explorer-bradbury.genlayer.com/address/0xE872ab6D367669af00CCCd9295CeaA9FcCD2BFCe) | template-aware, threshold-bound AI consensus, evaluation, and settlement messages |
| `GlobalLeaderboard` | current | [`0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB`](https://explorer-bradbury.genlayer.com/address/0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB) | cumulative contributor rankings |

Deployment and authorization transactions:

| Action | Tx |
| --- | --- |
| Deploy `TaskManager v4.3.0` | [`0x2e4cf0b698a002cf500f327943326f4fcc6a74bff7f45e0e8c2a8f16d503707c`](https://explorer-bradbury.genlayer.com/tx/0x2e4cf0b698a002cf500f327943326f4fcc6a74bff7f45e0e8c2a8f16d503707c) |
| Deploy `ProofOfImpact v4.3.0` | [`0x2a6d812afb118b7c4ed5adc37bdee06bcdafe9ea55da68144ee28d0f21c0319a`](https://explorer-bradbury.genlayer.com/tx/0x2a6d812afb118b7c4ed5adc37bdee06bcdafe9ea55da68144ee28d0f21c0319a) |
| Deploy `GlobalLeaderboard` | [`0x25caf03e928242ed11e3382002e6d5d72c32d4f5880f804b5f0fdb0f437fe593`](https://explorer-bradbury.genlayer.com/tx/0x25caf03e928242ed11e3382002e6d5d72c32d4f5880f804b5f0fdb0f437fe593) |
| Authorize `ProofOfImpact v4.3.0` in `TaskManager` | [`0xfa7f288aea167e319608c40ba6ac91c62595e3da12733787eab15974020ed4c2`](https://explorer-bradbury.genlayer.com/tx/0xfa7f288aea167e319608c40ba6ac91c62595e3da12733787eab15974020ed4c2) |
| Authorize `ProofOfImpact v4.3.0` in `GlobalLeaderboard` | [`0x0a6d54be1b2ec85edddb9b7211e98e4ca1adf2539074d847978f2ee4155153ab`](https://explorer-bradbury.genlayer.com/tx/0x0a6d54be1b2ec85edddb9b7211e98e4ca1adf2539074d847978f2ee4155153ab) |

L2 native ETH escrow deployments:

| Network | Chain ID | Escrow | Deploy Tx |
| --- | ---: | --- | --- |
| Ethereum Sepolia | `11155111` | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` | `0xec974fe6af6c6f8ee5ad1aca3e32acdab351d2fe6e5ee18e4ad7e7be0ccb69af` |
| Base Sepolia | `84532` | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` | `0xd863785a07576a8a75ee74019f56b8eef3bbc99c64f7efd127d02255af646a9f` |
| OP Sepolia | `11155420` | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` | `0xc3b70d3b59bbb163f3acd1c59416b306656fa89208ff9f8136cbc267c6f91e07` |
| Arbitrum Sepolia | `421614` | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` | `0x8d7186c50c7dfa272c38096ae5ac93aca8a8511ed0a98c6e7674c8a153a269e0` |

---

## Verified On-Chain Tests

The v4.3 escrow path is tested with both GenLayer direct-mode tests and Hardhat
EVM tests for the L2 escrow. The older Bradbury native GEN smoke test is kept
below as a historical compatibility proof.

| Field | Value |
| --- | --- |
| Transaction | [`0xe5fd2c69f520988b0918eb431ad7a547451642c725dcfe404a94dd218705440c`](https://explorer-bradbury.genlayer.com/tx/0xe5fd2c69f520988b0918eb431ad7a547451642c725dcfe404a94dd218705440c) |
| Task | `task-0` |
| Deposit | `0.001 GEN` |
| Stored escrow | `1000000000000000 wei` |
| Contract balance after | `1000000000000000 wei` |
| Escrow state | `funded`, not settled |

Fourteen direct GenLayer tests cover zero-deposit rejection, exact accounting,
authorization, scores immediately below and at the payout cutoff, one-time
payout, creator lockup, expiry grace, refund, self-submission rejection, and
deadline enforcement. The new tests also cover templates, real external ETH
escrow registration, required escrow receipts, release receipt accounting, and
refund receipt accounting.

Five Hardhat tests cover the `L2TaskEscrow` fund lifecycle: ETH locking, empty
and duplicate escrow rejection, authorized settler enforcement, threshold-bound
release, failed payout retryability, creator refund, and double-settlement
protection.

---

## Architecture

```text
                               Proof of Impact

  User / Contributor
        |
        | MetaMask identity + GenLayer contract calls
        v
  React + Vite frontend
        |
        | create L2 escrow with native ETH
        v
  L2TaskEscrow on selected ETH testnet
        |
        | escrow id + deposit tx
        v
  TaskManager escrow + task profile
        |
        | task data, template requirements, selected ETH escrow
        v
  ProofOfImpact
        |
        | independent web fetch -> AI validator consensus
        v
  Evaluation result stored on-chain
        |                         |
        | record_evaluation()     | record_score()
        v                         v
  TaskManager settlement     GlobalLeaderboard
        |
        | external_payout_ready / external_refund_ready
        v
  L2TaskEscrow release/refund
```

### Contract responsibilities

| Contract | Responsibilities |
| --- | --- |
| `TaskManager.py` | tracks task lifecycle, templates, external ETH escrow references, payout/refund readiness, and GenLayer-side accounting |
| `ProofOfImpact.py` | validates submissions, independently fetches evidence, applies the selected review template, stores evaluation JSON, and emits finalized settlement writes |
| `global_leaderboard.py` | records cumulative contributor scores and returns ranked entries |
| `L2TaskEscrow.sol` | locks native ETH on supported testnets and performs atomic release/refund without clearing state on failed transfers |

This separation keeps each contract focused and avoids forcing the frontend to
rebuild rankings by scraping every historical submission.

---

## How AI Evaluation Works

The evaluation path is intentionally layered.

### 1. Input validation

The contract first validates basic submission shape:

- URL must start with `http`, `https`, or `ipfs`.
- title, description, criteria, and submission text must be non-empty.
- text fields must stay inside contract length limits.

The contract does not use one generic proof-of-work rubric. Each task now stores
a review template:

| Template | Review emphasis |
| --- | --- |
| `code` | repository evidence, commits, tests, documentation, runnable delivery |
| `research` | sources, methodology, citations, factual support |
| `design` | design files, screenshots, usability, brief alignment |
| `community` | campaign links, metrics, anti-spam context, authentic reach |
| `content` | publication quality, originality, accuracy, distribution proof |
| `data` | dataset provenance, schema, cleaning notes, validation checks |

The final score is produced by validator consensus over the fetched evidence,
task criteria, and the selected template's evidence requirements.

### 2. Independent evidence consensus

The submitted URL is fetched inside a dedicated equivalence block. `strict_eq`
causes validators to independently retrieve the evidence and only accepts a
canonical result when they agree on the fetched content:

```python
def fetch_evidence():
    return str(gl.nondet.web.render(work_url, mode="text"))[:2000]

verified_content = gl.eq_principle.strict_eq(fetch_evidence)
```

This prevents an inaccessible page, a hallucinated description, or one
validator's private fetch result from becoming the shared source of truth.

### 3. Threshold-bound comparative AI scoring

The contract passes the task's exact `payout_threshold` into the evaluation
prompt and runs a custom comparative validator with `run_nondet_unsafe`.
Validators independently score the same verified evidence. They may differ by
at most 10 score points, but they must agree exactly on URL validity and on the
derived `payout_eligible = score >= payout_threshold` decision. This prevents
scores on opposite sides of the payout cutoff from reaching consensus.

The final JSON includes:

```json
{
  "score": 100,
  "grade": "A",
  "feedback": "...",
  "strengths": [],
  "improvements": [],
  "criteria_scores": {},
  "risk_flags": [],
  "payout_threshold": 70,
  "payout_eligible": true
}
```

### 4. On-chain effects

After evaluation:

- the submission JSON is updated,
- `score_storage[sub_id]` is updated,
- `TaskManager.record_evaluation()` is emitted after finalization,
- the first score at or above the task threshold marks the external ETH payout ready,
- `GlobalLeaderboard.record_score()` is emitted after finalization when points are greater than `0`.

---

## Frontend Integration

The frontend contract client lives in:

```text
src/lib/contract.js
```

The public Bradbury deployment is committed in `src/lib/deployments.js`.
Vite environment variables can override those public addresses for local forks
or future redeployments:

```bash
cp .env.example .env.local
```

Active Bradbury configuration:

```bash
VITE_TASK_MANAGER_ADDRESS=0xF4Fa50664E9c61e3a910b796aA702BfA96C8a50D
VITE_PROOF_OF_IMPACT_ADDRESS=0xE872ab6D367669af00CCCd9295CeaA9FcCD2BFCe
VITE_GLOBAL_LEADERBOARD_ADDRESS=0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB
VITE_L2_ESCROW_11155111=0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931
VITE_L2_ESCROW_84532=0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931
VITE_L2_ESCROW_11155420=0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931
VITE_L2_ESCROW_421614=0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931
```

The app uses:

- `L2TaskEscrow` for native ETH deposits, releases, and refunds,
- `TaskManager` for task creation, escrow receipt reads, and expired refund readiness,
- `ProofOfImpact` for submissions and evaluation,
- `GlobalLeaderboard` for rankings.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router |
| Styling | TailwindCSS |
| Wallet UI | RainbowKit |
| Wallet/client stack | wagmi, viem, genlayer-js |
| Contracts | GenLayer Python intelligent contracts |
| Network | Bradbury Testnet |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MetaMask
- Bradbury test GEN from the GenLayer faucet for GenLayer writes
- testnet ETH on the selected L2 testnets for task escrow funding

### Install

```bash
git clone https://github.com/nanometa/Proof-of-Impact.git
cd Proof-of-Impact
npm install
cp .env.example .env.local
```

### Run locally

```bash
npm run dev
```

The app starts at:

```text
http://localhost:5173
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## GenLayer CLI

Set the target network:

```bash
npx --yes genlayer@latest network set testnet-bradbury
npx --yes genlayer@latest network info
```

Read deployed contract state:

```bash
npx --yes genlayer@latest call 0xE872ab6D367669af00CCCd9295CeaA9FcCD2BFCe get_version
npx --yes genlayer@latest call 0xF4Fa50664E9c61e3a910b796aA702BfA96C8a50D get_authorized_submitter
npx --yes genlayer@latest call 0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB get_authorized_writer
```

Lint contracts:

```bash
genvm-lint check contracts/ProofOfImpact.py
genvm-lint check contracts/TaskManager.py
genvm-lint check contracts/global_leaderboard.py
```

Run the direct escrow suite and production build:

```bash
pytest tests/direct -v
npm run build
```

---

## Project Structure

```text
Proof-of-Impact/
  contracts/
    ProofOfImpact.py      # v4.3 template-aware evaluator
    TaskManager.py        # v4.3 templates + external ETH escrow lifecycle
    global_leaderboard.py
    contractABI.json
    evm/
      L2TaskEscrow.sol
  tests/
    direct/
      test_task_manager_escrow.py
    evm/
      L2TaskEscrow.test.cjs
  public/
    logo.svg
  src/
    components/
    lib/
      contract.js
    pages/
  .env.example
  package.json
  README.md
```

---

## Security

- Private keys and seed phrases must never be committed.
- `.env`, `.env.local`, `.codex-py`, `node_modules`, and `dist` are ignored.
- This repository stores only public contract addresses and public transaction hashes.
- Task creators cannot cancel or close a funded bounty early; ETH remains locked in L2 escrow until a qualifying winner or expiry.
- Expiry refunds wait through a 24-hour settlement grace period so finalized submission messages can arrive.
- GenLayer accounting is not reduced until a successful L2 payout or refund transaction is recorded.
- Failed L2 payout/refund transfers revert and remain retryable instead of marking the task settled.
- The browser may store a local burner key in local storage for GenLayer calls;
  that key is local-only and is not part of the repository.

---

## Roadmap

- Optional authenticated cross-chain settlement proofs instead of the current authorized settler path.
- Richer leaderboard filters by task type and date window.
- Better evaluation receipts in the UI with explorer links.
- Optional appeal/re-evaluation workflow.
- Better prompt templates for more task families while keeping scoring AI-driven.

---

## License

MIT. See [`LICENSE`](LICENSE).
