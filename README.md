<div align="center">

<img src="public/logo.svg" alt="Proof of Impact" width="88" />

# Proof of Impact

**Fund work with native GEN, submit verifiable evidence, and let decentralized AI validators score category-specific work against an explicit payout threshold.**

[**Live Demo**](https://proof-of-impact-pi.vercel.app/) - [**Bradbury Explorer**](https://explorer-bradbury.genlayer.com) - [**GenLayer**](https://genlayer.com)

[![Live](https://img.shields.io/badge/Live-proof--of--impact--pi.vercel.app-10b981?style=flat-square&logo=vercel)](https://proof-of-impact-pi.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![Version](https://img.shields.io/badge/ProofOfImpact-v4.2.0-22c55e?style=flat-square)](#current-bradbury-deployment)
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
criteria and locks a native GEN bounty in the `TaskManager` contract.
Contributors submit evidence through a URL, and GenLayer validators use
AI-assisted consensus to score the submission from `0` to `100`.

The result is written on-chain with:

- a numeric score,
- a grade,
- detailed feedback,
- criteria-level scoring,
- risk flags,
- contributor points pushed into a global leaderboard,
- the task's selected review template and ETH testnet rail,
- and a one-time GEN escrow settlement when the winning threshold is reached.

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
| Workers have no payment guarantee | native GEN leaves the creator wallet and remains locked in contract escrow |
| Leaderboards are off-chain | cumulative impact points are stored in `GlobalLeaderboard` |
| Historical submissions are expensive to scrape | rankings are updated directly by contract writes |

---

## Key Features

- **Native GEN Escrow** - every task requires a payable GEN deposit held by `TaskManager`.
- **Guaranteed Settlement** - the first qualifying submission receives the full bounty; creators cannot withdraw it early.
- **Expiry Protection** - a bounty can be refunded only after the deadline and a 24-hour finalization window.
- **Template-Based Task Marketplace** - create tasks with custom criteria, reward points, payout threshold, deadline, and a specialized review profile.
- **Specialized Review Templates** - code, research, design, community, content, and data tasks each carry their own evidence requirements and risk flags.
- **ETH Testnet Rail Metadata** - creators can tag tasks for Ethereum Sepolia, Base Sepolia, OP Sepolia, or Arbitrum Sepolia native ETH payout readiness.
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
`v4.2-template-and-network-rails` source branch on GenLayer Bradbury
Testnet.

| Contract | Version | Address | Purpose |
| --- | --- | --- | --- |
| `TaskManager` | `4.2.0` | [`0xFB837f3aC53AEdf9951580D04eFb1D2aacd46959`](https://explorer-bradbury.genlayer.com/address/0xFB837f3aC53AEdf9951580D04eFb1D2aacd46959) | payable task creation, native GEN escrow, templates, ETH testnet rail metadata, payout and refund |
| `ProofOfImpact` | `4.2.0` | [`0xCCf03Aba1011CE2393eA8B762208e9bdd82123Bf`](https://explorer-bradbury.genlayer.com/address/0xCCf03Aba1011CE2393eA8B762208e9bdd82123Bf) | template-aware, threshold-bound AI consensus, evaluation, and settlement messages |
| `GlobalLeaderboard` | current | [`0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB`](https://explorer-bradbury.genlayer.com/address/0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB) | cumulative contributor rankings |

Deployment and authorization transactions:

| Action | Tx |
| --- | --- |
| Deploy `TaskManager v4.2.0` | [`0x260ec92850b2eec3374da50c403825df03e40f781cfd0975442bd14934f4f9cb`](https://explorer-bradbury.genlayer.com/tx/0x260ec92850b2eec3374da50c403825df03e40f781cfd0975442bd14934f4f9cb) |
| Deploy `ProofOfImpact v4.2.0` | [`0x199dfe1789f32e1c00c3aed5ade45b38916b09646c92ff044a93f8195fc629ca`](https://explorer-bradbury.genlayer.com/tx/0x199dfe1789f32e1c00c3aed5ade45b38916b09646c92ff044a93f8195fc629ca) |
| Deploy `GlobalLeaderboard` | [`0x25caf03e928242ed11e3382002e6d5d72c32d4f5880f804b5f0fdb0f437fe593`](https://explorer-bradbury.genlayer.com/tx/0x25caf03e928242ed11e3382002e6d5d72c32d4f5880f804b5f0fdb0f437fe593) |
| Authorize `ProofOfImpact v4.2.0` in `TaskManager` | [`0x87371878c429f7900357d9c7789c016da1e51740aee7e3e50f999e57f92eb694`](https://explorer-bradbury.genlayer.com/tx/0x87371878c429f7900357d9c7789c016da1e51740aee7e3e50f999e57f92eb694) |
| Authorize `ProofOfImpact v4.2.0` in `GlobalLeaderboard` | [`0x3ca16e6590a3ff1c9222ce97c089be76ac0736f650bede13f52c723787d0d2fe`](https://explorer-bradbury.genlayer.com/tx/0x3ca16e6590a3ff1c9222ce97c089be76ac0736f650bede13f52c723787d0d2fe) |

---

## Verified On-Chain Tests

The v4 escrow was tested directly on Bradbury with a real native GEN deposit.

| Field | Value |
| --- | --- |
| Transaction | [`0xe5fd2c69f520988b0918eb431ad7a547451642c725dcfe404a94dd218705440c`](https://explorer-bradbury.genlayer.com/tx/0xe5fd2c69f520988b0918eb431ad7a547451642c725dcfe404a94dd218705440c) |
| Task | `task-0` |
| Deposit | `0.001 GEN` |
| Stored escrow | `1000000000000000 wei` |
| Contract balance after | `1000000000000000 wei` |
| Escrow state | `funded`, not settled |

Eleven direct GenLayer tests cover zero-deposit rejection, exact accounting,
authorization, scores immediately below and at the payout cutoff, one-time
payout, creator lockup, expiry grace, refund, self-submission rejection, and
deadline enforcement. The new tests also cover template metadata, ETH testnet
rail metadata, supported network/template views, and rejection of unsupported
profiles.

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
        | create_task(value = native GEN)
        v
  TaskManager escrow + task profile
        |
        | task data, template requirements, selected ETH testnet rail
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
        | finalized native transfer
        v
  Winning contributor
```

### Contract responsibilities

| Contract | Responsibilities |
| --- | --- |
| `TaskManager.py` | receives native GEN, locks task bounties, tracks lifecycle, stores task templates and ETH testnet rail metadata, pays one winner, and refunds expired tasks |
| `ProofOfImpact.py` | validates submissions, independently fetches evidence, applies the selected review template, stores evaluation JSON, and emits finalized settlement writes |
| `global_leaderboard.py` | records cumulative contributor scores and returns ranked entries |

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
- the first score at or above the task threshold schedules the native GEN transfer,
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
VITE_TASK_MANAGER_ADDRESS=0xFB837f3aC53AEdf9951580D04eFb1D2aacd46959
VITE_PROOF_OF_IMPACT_ADDRESS=0xCCf03Aba1011CE2393eA8B762208e9bdd82123Bf
VITE_GLOBAL_LEADERBOARD_ADDRESS=0x552FA16bD9F9b9Bd2F6fDa577657033F01d505fB
```

The app uses:

- `TaskManager` for payable task creation, escrow reads, and expired refunds,
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
- Bradbury test GEN from the GenLayer faucet

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
npx --yes genlayer@latest call 0xCCf03Aba1011CE2393eA8B762208e9bdd82123Bf get_version
npx --yes genlayer@latest call 0xFB837f3aC53AEdf9951580D04eFb1D2aacd46959 get_authorized_submitter
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
    ProofOfImpact.py      # v4.2 template-aware evaluator
    TaskManager.py        # v4.2 escrow + templates + ETH testnet rail metadata
    global_leaderboard.py
    contractABI.json
  tests/
    direct/
      test_task_manager_escrow.py
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
- Task creators cannot cancel or close a funded bounty early; GEN remains locked until a qualifying winner or expiry.
- Expiry refunds wait through a 24-hour settlement grace period so finalized submission messages can arrive.
- Payout state is committed before the external transfer is scheduled, preventing duplicate settlement.
- ETH testnet rails are stored explicitly as task metadata. The current
  canonical escrow remains native GEN on GenLayer until a separate L2 escrow or
  bridge module is connected; the app does not fake an L2 transfer.
- The browser may store a local burner key in local storage for GenLayer calls;
  that key is local-only and is not part of the repository.

---

## Roadmap

- Optional L2 escrow modules for the ETH testnet rails already stored by tasks.
- Richer leaderboard filters by task type and date window.
- Better evaluation receipts in the UI with explorer links.
- Optional appeal/re-evaluation workflow.
- Better prompt templates for more task families while keeping scoring AI-driven.

---

## License

MIT. See [`LICENSE`](LICENSE).
