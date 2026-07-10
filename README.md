<div align="center">

<img src="public/logo.svg" alt="Proof of Impact" width="88" />

# Proof of Impact

**AI-native work verification on GenLayer. Create tasks, submit proof URLs, and let decentralized AI validators score real-world impact on-chain.**

[**Live Demo**](https://proof-of-impact-pi.vercel.app/) - [**Bradbury Explorer**](https://explorer-bradbury.genlayer.com) - [**GenLayer**](https://genlayer.com)

[![Live](https://img.shields.io/badge/Live-proof--of--impact--pi.vercel.app-10b981?style=flat-square&logo=vercel)](https://proof-of-impact-pi.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![Version](https://img.shields.io/badge/ProofOfImpact-v3.1.0-22c55e?style=flat-square)](#current-bradbury-deployment)
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
criteria, contributors submit evidence through a URL, and GenLayer validators
use AI-assisted consensus to score the submission from `0` to `100`.

The result is written on-chain with:

- a numeric score,
- a grade,
- detailed feedback,
- criteria-level scoring,
- risk flags,
- and contributor points pushed into a global leaderboard.

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
| Leaderboards are off-chain | cumulative impact points are stored in `GlobalLeaderboard` |
| Historical submissions are expensive to scrape | rankings are updated directly by contract writes |

---

## Key Features

- **Task Marketplace** - create open tasks with title, description, criteria, and reward points.
- **AI-Powered Evaluation** - validators score submissions using task-specific evidence and criteria.
- **Independent Evidence Consensus** - validators independently re-fetch the submitted URL before AI scoring can reach consensus.
- **On-Chain Leaderboard** - contributor points are written to a dedicated leaderboard contract.
- **Detailed Feedback** - every evaluated submission includes strengths, improvements, grade, and risk flags.
- **Three-Contract Architecture** - task lifecycle, evaluation, and rankings are separated cleanly.
- **Environment-Based Deployment** - contract addresses are configured through Vite environment variables, with no source-code fallbacks.
- **Responsive Web App** - React, Vite, TailwindCSS, RainbowKit, wagmi, and genlayer-js.

---

## Current Bradbury Deployment

This README documents the active `v3.1-independent-evidence-consensus` deployment on
GenLayer Bradbury Testnet.

| Contract | Version | Address | Purpose |
| --- | --- | --- | --- |
| `TaskManager` | `3.0.0` | [`0x90Cad9eBfeCcCb1Dafe7070b93a89dfDe9E4Bd50`](https://explorer-bradbury.genlayer.com/address/0x90Cad9eBfeCcCb1Dafe7070b93a89dfDe9E4Bd50) | task creation, task status, task counters |
| `ProofOfImpact` | `3.1.0` | [`0xa37000f1522f9102D0D6EF16E9061faA3BF91C68`](https://explorer-bradbury.genlayer.com/address/0xa37000f1522f9102D0D6EF16E9061faA3BF91C68) | independent evidence consensus, AI evaluation, points |
| `GlobalLeaderboard` | current | [`0xc335b7326D70067373b7c8c88f42803BcDcC1D5C`](https://explorer-bradbury.genlayer.com/address/0xc335b7326D70067373b7c8c88f42803BcDcC1D5C) | cumulative contributor rankings |

Deployment and authorization transactions:

| Action | Tx |
| --- | --- |
| Deploy `TaskManager` | [`0x370a653bebc20da0bad82b1ddaff0a1e105fa74c593d0f40c33c62741b4952fa`](https://explorer-bradbury.genlayer.com/tx/0x370a653bebc20da0bad82b1ddaff0a1e105fa74c593d0f40c33c62741b4952fa) |
| Deploy `ProofOfImpact v3.1.0` | [`0x59d86274b26d1d266c587e1e54762ce51be79f6dd5b106104f4493d7556888a5`](https://explorer-bradbury.genlayer.com/tx/0x59d86274b26d1d266c587e1e54762ce51be79f6dd5b106104f4493d7556888a5) |
| Deploy `GlobalLeaderboard` | [`0x4d86e46fdedfd082f222baf02159ff5514e438bb1f1e76c167d3018f80851d4f`](https://explorer-bradbury.genlayer.com/tx/0x4d86e46fdedfd082f222baf02159ff5514e438bb1f1e76c167d3018f80851d4f) |
| Authorize `ProofOfImpact` in `TaskManager` | verified by `get_authorized_submitter()` |
| Authorize `ProofOfImpact` in `GlobalLeaderboard` | verified by `get_authorized_writer()` |

---

## Verified On-Chain Tests

`ProofOfImpact v3.1.0` was tested directly on Bradbury with real
transactions.

Task: require a direct raw MIT license file containing the full license terms.

Submitted URL:

```text
https://raw.githubusercontent.com/facebook/react/main/LICENSE
```

Result:

| Field | Value |
| --- | --- |
| Submission | `task-6`, `sub-0` |
| Score | `100` |
| Grade | `A` |
| Points earned | `100` |
| Evaluation tx | [`0x7dc84674f3ccae729f06e1216df8c62ea09eb2086adb4fc4a293856262d9c0ae`](https://explorer-bradbury.genlayer.com/tx/0x7dc84674f3ccae729f06e1216df8c62ea09eb2086adb4fc4a293856262d9c0ae) |

Negative control: the same task criteria were tested with a React source file
instead of the requested license:

```text
https://raw.githubusercontent.com/facebook/react/main/packages/react/index.js
```

The independently fetched content was identified as the wrong artifact and
received `0/F` with `wrong_artifact` and `misrepresentation` risk flags.
Evaluation tx: [`0x11543c5836dc3c81ec96700a1441e4bc8a23ef4109c02d91a350ab3b1833be51`](https://explorer-bradbury.genlayer.com/tx/0x11543c5836dc3c81ec96700a1441e4bc8a23ef4109c02d91a350ab3b1833be51).

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
        | create_task()
        v
  TaskManager
        |
        | submit_work() / evaluate_submission()
        v
  ProofOfImpact
        |
        | web evidence -> AI validator consensus
        v
  Evaluation result stored on-chain
        |
        | record_score()
        v
  GlobalLeaderboard
```

### Contract responsibilities

| Contract | Responsibilities |
| --- | --- |
| `TaskManager.py` | creates tasks, tracks task status, submission counts, evaluated counts, and awarded points |
| `ProofOfImpact.py` | validates submissions, evaluates evidence, stores score JSON, awards points, emits cross-contract writes |
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

The contract does not use hardcoded repository rules or deterministic
task-specific scoring gates. The final score is produced by validator consensus
over the fetched evidence and task criteria.

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

### 3. Comparative AI scoring

The contract then builds a task-aware prompt from `verified_content` and runs a
second `prompt_comparative` equivalence block. Validators must agree on the
score band, URL validity, and factual conclusion while allowing small numerical
variation in subjective scoring.

The final JSON includes:

```json
{
  "score": 100,
  "grade": "A",
  "feedback": "...",
  "strengths": [],
  "improvements": [],
  "criteria_scores": {},
  "risk_flags": []
}
```

### 4. On-chain effects

After evaluation:

- the submission JSON is updated,
- `score_storage[sub_id]` is updated,
- `TaskManager.record_evaluation()` is emitted,
- `GlobalLeaderboard.record_score()` is emitted when points are greater than `0`.

---

## Frontend Integration

The frontend contract client lives in:

```text
src/lib/contract.js
```

Addresses are required configuration. `src/lib/contract.js` validates the three
variables at startup and contains no deployed-address or zero-address fallback.
For local development:

```bash
cp .env.example .env.local
```

Active Bradbury configuration:

```bash
VITE_TASK_MANAGER_ADDRESS=0x90Cad9eBfeCcCb1Dafe7070b93a89dfDe9E4Bd50
VITE_PROOF_OF_IMPACT_ADDRESS=0xa37000f1522f9102D0D6EF16E9061faA3BF91C68
VITE_GLOBAL_LEADERBOARD_ADDRESS=0xc335b7326D70067373b7c8c88f42803BcDcC1D5C
```

The app uses:

- `TaskManager` for task reads and creation,
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
npx --yes genlayer@latest call 0xa37000f1522f9102D0D6EF16E9061faA3BF91C68 get_version
npx --yes genlayer@latest call 0x90Cad9eBfeCcCb1Dafe7070b93a89dfDe9E4Bd50 get_authorized_submitter
npx --yes genlayer@latest call 0xc335b7326D70067373b7c8c88f42803BcDcC1D5C get_authorized_writer
```

Lint contracts:

```bash
genvm-lint check contracts/ProofOfImpact.py
genvm-lint check contracts/TaskManager.py
genvm-lint check contracts/global_leaderboard.py
```

The currently published contracts deploy successfully on Bradbury, and the
frontend passes:

```bash
npm run build
```

---

## Project Structure

```text
Proof-of-Impact/
  contracts/
    ProofOfImpact.py
    TaskManager.py
    global_leaderboard.py
    contractABI.json
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
- The browser may store a local burner key in local storage for GenLayer calls;
  that key is local-only and is not part of the repository.

---

## Roadmap

- More task templates for common open-source contribution categories.
- Richer leaderboard filters by task type and date window.
- Better evaluation receipts in the UI with explorer links.
- Optional appeal/re-evaluation workflow.
- Better prompt templates for more task families while keeping scoring AI-driven.

---

## License

MIT. See [`LICENSE`](LICENSE).
