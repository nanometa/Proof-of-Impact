<div align="center">

<img src="public/logo.svg" alt="Proof of Impact" width="80" />

# Proof of Impact

**A decentralized work platform on GenLayer where AI validators score contributions on-chain.**

[**🚀 Live Demo**](https://proof-of-impact-pi.vercel.app/) · [**📖 Docs**](#table-of-contents) · [**🔍 Explorer**](https://explorer-bradbury.genlayer.com)

[![Live](https://img.shields.io/badge/Live-proof--of--impact--pi.vercel.app-10b981?style=flat-square&logo=vercel)](https://proof-of-impact-pi.vercel.app/)
[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-f59e0b?style=flat-square)](https://genlayer.com)
[![License](https://img.shields.io/badge/License-MIT-64748b?style=flat-square)](#license)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Network](#network)
- [Smart Contract](#smart-contract)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [How AI Evaluation Works](#how-ai-evaluation-works)
- [Design System](#design-system)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

---

## Overview

**Proof of Impact** is a decentralized application built on the **GenLayer Bradbury Testnet** that turns subjective work evaluation into an on-chain, AI-validated process. Anyone can publish a task with custom criteria, contributors submit their work as a URL, and a network of **AI validators** scores each submission using GenLayer's **Optimistic Democracy** consensus.

Scores, grades, and detailed feedback are stored on-chain and aggregated into a global **leaderboard** that ranks contributors by cumulative impact points.

This project showcases what GenLayer makes possible: smart contracts that reason over the real world (URLs, prose, subjective criteria) without trusting a single oracle.

---

## Live Demo

> **🌐 Try it now:** **[proof-of-impact-pi.vercel.app](https://proof-of-impact-pi.vercel.app/)**

Connect MetaMask, switch to **Bradbury Testnet** (Chain ID `4221`), grab some test GEN from the [faucet](https://testnet-faucet.genlayer.foundation), and start creating tasks or submitting work. All transactions hit the live contract on Bradbury and are verifiable in the [GenLayer Explorer](https://explorer-bradbury.genlayer.com/address/0xD931392177067735378b26e5EE37851284c19d69).

---

## Key Features

- **Task Marketplace** — Publish open tasks with title, description, evaluation criteria, and reward points.
- **AI-Powered Evaluation** — Submissions are graded on a 0–100 scale by multiple AI validators reaching consensus.
- **On-Chain Leaderboard** — Cumulative scores are stored per address and ranked globally.
- **Detailed Feedback** — Every evaluation returns a grade (A/B/C/D/F), strengths, improvements, and criteria-level scores.
- **Hybrid Wallet Flow** — MetaMask for identity (UX), local GenLayer account for signing (so transactions correctly register as `Call`, not `Send`).
- **Bloomberg × Web3 Aesthetic** — Dark glassmorphism, monospace typography, animated wave background, neon accents.
- **Fully Responsive** — Desktop-first but works on tablet and mobile.

---

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| **Framework** | React | `18.2.0` |
| **Build** | Vite | `5.0.0` |
| **Routing** | React Router | `6.20.0` |
| **Styling** | TailwindCSS | `3.4.0` |
| **GenLayer SDK** | genlayer-js | `1.1.8` |
| **Wallet (Identity)** | wagmi + viem | `2.19.5` / `2.50.4` |
| **Wallet UI** | RainbowKit | `2.2.11` |
| **Data** | TanStack Query | `5.100.11` |
| **Smart Contract** | Python (GenLayer) | latest |
| **Deployment** | Vercel | — |

---

## Network

The dApp talks to a single live contract on the **GenLayer Bradbury Testnet**.

| Field | Value |
| --- | --- |
| **Chain Name** | Bradbury Testnet |
| **Chain ID** | `4221` |
| **Currency** | `GEN` |
| **RPC URL** | `https://rpc-bradbury.genlayer.com` |
| **Explorer** | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |
| **Faucet** | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation) |
| **Contract Address** | [`0xD931392177067735378b26e5EE37851284c19d69`](https://explorer-bradbury.genlayer.com/address/0xD931392177067735378b26e5EE37851284c19d69) |

---

## Smart Contract

The contract is written in Python using the GenLayer SDK and lives at [`contracts/ProofOfImpact.py`](contracts/ProofOfImpact.py) — the exact version deployed at `0xD931392177067735378b26e5EE37851284c19d69` on Bradbury.

### Write methods

```python
@gl.public.write
def create_task(title, description, criteria, reward_points) -> str
# Publishes a new task. Returns task_id like "task-0".

@gl.public.write
def submit_work(task_id, work_url, description) -> str
# Attaches a submission to an open task. Returns sub_id like "sub-0".

@gl.public.write
def evaluate_submission(sub_id) -> str
# Triggers AI evaluation via gl.eq_principle.prompt_comparative.
# Returns JSON with score, grade, feedback, strengths, improvements.
```

### Read methods

```python
@gl.public.view
def get_task(task_id) -> str            # JSON of the task
def get_submission(sub_id) -> str       # JSON of the submission
def get_score(sub_id) -> u256           # 0-100 score
def get_leaderboard_score(address) -> u256  # cumulative points
def get_task_count() -> u256
def get_submission_count() -> u256
```

### AI evaluation core

```python
def evaluate_single_source():
    # Live URL fetch — penalized heavily if unreachable or empty
    try:
        url_content = gl.nondet.web.render(work_url, mode="text")[:600]
    except Exception:
        url_content = "URL could not be fetched."
    prompt = build_evaluation_prompt(
        task_title, task_description, task_criteria,
        work_url, work_description, url_content,
    )
    return parse_evaluation_result(gl.nondet.exec_prompt(prompt))

result_json = gl.eq_principle.prompt_comparative(
    evaluate_single_source,
    principle=(
        "score must be within 5 points. "
        "grade must match exactly. "
        "url_valid must match exactly."
    ),
)
```

The `prompt_comparative` call asks multiple validator nodes to run the same prompt independently. The **Equivalence Principle** then merges their outputs into a single deterministic result that the chain can finalize.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       React + Vite UI                        │
│   LandingPage · HomePage · TaskPage · SubmissionPage         │
│   CreateTaskPage · SubmitWorkPage · LeaderboardPage          │
└───────────┬──────────────────────────────────┬───────────────┘
            │                                  │
            │ identity (display address)       │ contract reads/writes
            ▼                                  ▼
   ┌────────────────────┐           ┌─────────────────────────┐
   │ MetaMask (wagmi /  │           │  genlayer-js client      │
   │ RainbowKit)        │           │  + createAccount()       │
   └────────────────────┘           └────────────┬────────────┘
                                                 │
                                                 ▼
                              ┌────────────────────────────────┐
                              │ GenLayer Bradbury Testnet      │
                              │ Chain ID 4221                  │
                              │ ProofOfImpact.py contract      │
                              │ (AI validator network)         │
                              └────────────────────────────────┘
```

**Why two wallets?** GenLayer routes transactions as either `Send` (plain transfer) or `Call` (contract execution). MetaMask's signer was producing `Send` envelopes, so the app keeps MetaMask for **identity display** and uses a locally generated GenLayer account from `createAccount()` to **sign every contract call**. The user always sees their own MetaMask address in the navbar.

---

## Getting Started

### Prerequisites

- Node.js `18+`
- npm or pnpm
- MetaMask (for identity / address display)
- A small amount of test GEN from the [Bradbury faucet](https://testnet-faucet.genlayer.foundation)

### Installation

```bash
git clone https://github.com/nanometa/Proof-of-Impact.git
cd Proof-of-Impact
npm install
```

### Run locally

```bash
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview
```

The production bundle is emitted to `dist/`.

---

## Usage Guide

1. **Connect Wallet** — Click _Connect Wallet_ in the navbar. MetaMask will prompt; switch to Bradbury Testnet if asked.
2. **Create a Task** — Go to `/app/create`. Fill in title, description, evaluation criteria, and reward points, then submit.
3. **Submit Work** — Open any task from `/app`, click _Submit Work_, and paste a URL plus a short description of what you did.
4. **Request AI Evaluation** — Open the submission detail page and click _Evaluate_. The contract runs the AI validators, and the result (score, grade, detailed feedback) is written on-chain.
5. **Climb the Leaderboard** — Visit `/app/leaderboard` to see addresses ranked by cumulative score.

---

## Project Structure

```
proof-of-impact/
├── contracts/
│   ├── ProofOfImpact.py         # Live Bradbury contract (deployed at 0xD931…19d69)
│   ├── global_leaderboard.py    # Leaderboard helper
│   └── contractABI.json         # Network metadata (Bradbury)
├── public/
│   ├── logo.png
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Navbar + RainbowKit ConnectButton
│   │   ├── ScoreCircle.jsx
│   │   ├── GradeBadge.jsx
│   │   ├── Spinner.jsx
│   │   ├── WalletConnect.jsx
│   │   └── ui/wave-background.jsx
│   ├── context/
│   │   ├── WalletContext.jsx    # Address + connect/disconnect state
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   └── useContract.js
│   ├── lib/
│   │   ├── contract.js          # genlayer-js client + createAccount
│   │   ├── wagmi.js             # wagmi config (RainbowKit)
│   │   └── utils.js
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── CreateTaskPage.jsx
│   │   ├── TaskPage.jsx
│   │   ├── SubmitWorkPage.jsx
│   │   ├── SubmissionPage.jsx
│   │   └── LeaderboardPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## How AI Evaluation Works

GenLayer is the only chain where smart contracts can natively reason over **subjective inputs** (URLs, prose, images) without an off-chain oracle. Two ideas make this work:

### Optimistic Democracy

A small committee of validator nodes independently runs the same Python contract method. Each node has its own LLM, so each one returns a slightly different output (e.g., `score: 87`, `score: 84`, `score: 86`). Optimistic Democracy assumes the majority is honest and lets dissenting nodes challenge the result.

### The Equivalence Principle

To turn many "almost-equal" answers into one deterministic on-chain value, the contract calls `gl.eq_principle.prompt_comparative(...)` with a natural-language **principle** describing what counts as equivalent. In this dApp the principle is:

> _"score must be within 5 points · grade must match exactly · url_valid must match exactly"_

If the validators' outputs are equivalent under that rule, the chain finalizes a single canonical result. If not, the validators retry until consensus is reached or the call fails. This is what makes AI grading **trustlessly reproducible** instead of just averaged.

---

## Design System

The UI is a deliberate "Bloomberg Terminal × Web3" mashup: a black canvas, monospace numbers, animated phosphor wave field, and neon accents.

| Token | Value | Usage |
| --- | --- | --- |
| Background | `#000000` | Page base |
| Glass | `bg-white/5` + `backdrop-blur-md` | Cards, modals |
| Border | `border-white/10` | Card edges |
| Phosphor Green | `#10b981` | Positive states, "live" badge |
| Neon Purple | `#8b5cf6` | Brand accent, network badge |
| Sky Blue | `#3b82f6` | Chain ID, links |
| Warning Amber | `#f59e0b` | GenLayer brand badge |
| Slate | `#64748b` | Muted text, license badge |

Typography is `Geist Sans` for prose and `JetBrains Mono`-style monospace for code, addresses, and numbers.

---

## Roadmap

- [ ] Task expiration + auto-close after N submissions
- [ ] On-chain reputation NFTs for top contributors
- [ ] Optional human-in-the-loop dispute window
- [ ] Webhook notifications when a submission is evaluated
- [ ] Subgraph-style indexer for faster leaderboard queries
- [ ] Mobile-first redesign of the submission flow

---

## Contributing

Pull requests are welcome. For bigger changes, open an issue first to discuss what you would like to change.

```bash
# 1. Fork → clone
# 2. Create a feature branch
git checkout -b feat/your-feature

# 3. Commit
git commit -m "feat: short description"

# 4. Push and open a PR
git push origin feat/your-feature
```

Please run `npm run build` before opening a PR to confirm the bundle still compiles. Bundle-size warnings about chunks > 500 kB are expected and harmless.

---

## License

[MIT](LICENSE) © 2025 — Built for the **GenLayer Hackathon**.

---

## Links

- **Live demo:** https://proof-of-impact-pi.vercel.app/
- **Repository:** https://github.com/nanometa/Proof-of-Impact
- **Contract on explorer:** https://explorer-bradbury.genlayer.com/address/0xD931392177067735378b26e5EE37851284c19d69
- **GenLayer docs:** https://docs.genlayer.com
- **Bradbury faucet:** https://testnet-faucet.genlayer.foundation

<div align="center">

—

**Built with GenLayer.** Where smart contracts meet AI consensus.

</div>
