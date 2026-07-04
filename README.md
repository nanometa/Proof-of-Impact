<div align="center">

<img src="public/logo.svg" alt="Proof of Impact" width="88" />

# Proof of Impact

**AI-native work verification on GenLayer. Create tasks, submit proof URLs, and let decentralized AI validators score real-world impact on-chain.**

[**Live Demo**](https://proof-of-impact-pi.vercel.app/) - [**Bradbury Explorer**](https://explorer-bradbury.genlayer.com) - [**GenLayer**](https://genlayer.com)

[![Live](https://img.shields.io/badge/Live-proof--of--impact--pi.vercel.app-10b981?style=flat-square&logo=vercel)](https://proof-of-impact-pi.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![Version](https://img.shields.io/badge/ProofOfImpact-v3.0.2-22c55e?style=flat-square)](#current-bradbury-deployment)
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
- **Evidence-First AI Scoring** - validators fetch the submitted URL content and score it against the task criteria.
- **On-Chain Leaderboard** - contributor points are written to a dedicated leaderboard contract.
- **Detailed Feedback** - every evaluated submission includes strengths, improvements, grade, and risk flags.
- **Three-Contract Architecture** - task lifecycle, evaluation, and rankings are separated cleanly.
- **Bradbury Production Deployment** - frontend defaults point to the active v3 contracts.
- **Responsive Web App** - React, Vite, TailwindCSS, RainbowKit, wagmi, and genlayer-js.

---

## Current Bradbury Deployment

This README documents the active `v3-smart-async-3-contracts` deployment on
GenLayer Bradbury Testnet.

| Contract | Version | Address | Purpose |
| --- | --- | --- | --- |
| `TaskManager` | `3.0.0` | [`0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc`](https://explorer-bradbury.genlayer.com/address/0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc) | task creation, task status, task counters |
| `ProofOfImpact` | `3.0.2` | [`0x8D8117828E401bB674295963e0acbB4C7Af257bc`](https://explorer-bradbury.genlayer.com/address/0x8D8117828E401bB674295963e0acbB4C7Af257bc) | submissions, evidence-first AI evaluation, points |
| `GlobalLeaderboard` | current | [`0x0EB4407460b232cB5BAC868f1296641419Fc3711`](https://explorer-bradbury.genlayer.com/address/0x0EB4407460b232cB5BAC868f1296641419Fc3711) | cumulative contributor rankings |

Deployment and authorization transactions:

| Action | Tx |
| --- | --- |
| Deploy `TaskManager` | [`0x79823a4f2221f1d8a5e7f5093c9025cfc0c1f753d8665f2ed83e8cbb6c3e9862`](https://explorer-bradbury.genlayer.com/tx/0x79823a4f2221f1d8a5e7f5093c9025cfc0c1f753d8665f2ed83e8cbb6c3e9862) |
| Deploy `ProofOfImpact v3.0.2` | [`0x14d959edbfacf87944f08210fa7247d9bb738069260866e9a72d4a92d1ca93b6`](https://explorer-bradbury.genlayer.com/tx/0x14d959edbfacf87944f08210fa7247d9bb738069260866e9a72d4a92d1ca93b6) |
| Deploy `GlobalLeaderboard` | [`0xcaf7d3687e71af61cd768e405d3ac6a794a362872c81d941836cae977bae16b2`](https://explorer-bradbury.genlayer.com/tx/0xcaf7d3687e71af61cd768e405d3ac6a794a362872c81d941836cae977bae16b2) |
| Authorize `ProofOfImpact` in `TaskManager` | [`0x1428c5e94868b67c264ebb1244ce19920fbdb0f2fd99cdde83c29a711d75273e`](https://explorer-bradbury.genlayer.com/tx/0x1428c5e94868b67c264ebb1244ce19920fbdb0f2fd99cdde83c29a711d75273e) |
| Authorize `ProofOfImpact` in `GlobalLeaderboard` | [`0x07110571a5ddd910ef6eb7b5907e4ee98fbaba67fe1e616df053246d688c642c`](https://explorer-bradbury.genlayer.com/tx/0x07110571a5ddd910ef6eb7b5907e4ee98fbaba67fe1e616df053246d688c642c) |

Legacy note: the older contract at
`0xD931392177067735378b26e5EE37851284c19d69` is no longer the active
frontend target.

---

## Verified On-Chain Tests

`ProofOfImpact v3.0.2` was tested directly on Bradbury with real transactions.

### Negative control

Task: require a direct raw license file.

Submitted URL:

```text
https://raw.githubusercontent.com/facebook/react/main/packages/react/index.js
```

Expected: this is a source file, not a direct license file.

Result:

| Field | Value |
| --- | --- |
| Submission | `task-5`, `sub-0` |
| Score | `0` |
| Grade | `F` |
| Risk flags | `["not_direct_license_file"]` |
| Evaluation tx | [`0x600d2e6a433677c5b9c3f7a1288041a35f28baa3bb8dd1cc064bb4573afdc47f`](https://explorer-bradbury.genlayer.com/tx/0x600d2e6a433677c5b9c3f7a1288041a35f28baa3bb8dd1cc064bb4573afdc47f) |

### Positive control

Task: require a direct raw license file containing the full license terms.

Submitted URL:

```text
https://raw.githubusercontent.com/facebook/react/main/LICENSE
```

Result:

| Field | Value |
| --- | --- |
| Submission | `task-6`, `sub-1` |
| Score | `100` |
| Grade | `A` |
| Points earned | `100` |
| Evaluation tx | [`0xc6da961627490e9afb702d752228604ef8792ad453f99c8642321076563ca69a`](https://explorer-bradbury.genlayer.com/tx/0xc6da961627490e9afb702d752228604ef8792ad453f99c8642321076563ca69a) |

Leaderboard verification:

```text
GlobalLeaderboard.get_all_entries()
=> [{"address":"0xb42c1161bb124b9ceb7fd2439cbf3538e39b0619","score":375,"rank":1}]
```

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

### 1. Deterministic pre-checks

The contract first validates evidence shape:

- URL must be valid.
- Task-specific evidence gates can reject invalid proof immediately.
- License tasks require direct `LICENSE`, `LICENCE`, `COPYING`, or `NOTICE` files.

This is what makes irrelevant repository files return `0` quickly instead of
waiting for a long validator run.

### 2. Web evidence fetch

For submissions that pass the gate, the contract fetches the submitted URL with
GenLayer web nondeterminism:

```python
url_content = gl.nondet.web.render(work_url, mode="text")
```

### 3. AI validator scoring

The contract builds a task-aware prompt and asks validators to score the
submission using the task title, description, criteria, submitted URL,
contributor description, and fetched evidence.

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

Production defaults:

```js
const CONTRACT_ADDRESS = '0x8D8117828E401bB674295963e0acbB4C7Af257bc'
const TASK_MANAGER_CONTRACT = '0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc'
const LEADERBOARD_CONTRACT = '0x0EB4407460b232cB5BAC868f1296641419Fc3711'
```

Build-time overrides:

```bash
VITE_TASK_MANAGER_ADDRESS=0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc
VITE_PROOF_OF_IMPACT_ADDRESS=0x8D8117828E401bB674295963e0acbB4C7Af257bc
VITE_GLOBAL_LEADERBOARD_ADDRESS=0x0EB4407460b232cB5BAC868f1296641419Fc3711
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
npx --yes genlayer@latest call 0x8D8117828E401bB674295963e0acbB4C7Af257bc get_version
npx --yes genlayer@latest call 0xBba8FB0F21C1ebD7BDc32A43f7525fCbECF72aBc get_authorized_submitter
npx --yes genlayer@latest call 0x0EB4407460b232cB5BAC868f1296641419Fc3711 get_authorized_writer
```

Lint contracts:

```bash
genvm-lint check contracts/ProofOfImpact.py
genvm-lint check contracts/TaskManager.py
genvm-lint check contracts/global_leaderboard.py
```

The currently published contracts pass GenVM lint and the frontend passes:

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
