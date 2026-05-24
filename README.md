<div align="center">

# Proof of Impact

**A decentralized work platform on GenLayer where AI validators score contributions on-chain.**

[![Network](https://img.shields.io/badge/Network-Bradbury%20Testnet-8b5cf6?style=flat-square)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-4221-3b82f6?style=flat-square)](https://docs.genlayer.com/developers/networks)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](#license)

</div>

---


## Overview

**Proof of Impact** is a permissionless work-bounty dApp built on **GenLayer** — the AI-native blockchain. Anyone can post tasks with evaluation criteria, anyone can submit work, and **AI validators** score the submissions on-chain through GenLayer's Optimistic Democracy consensus.

No middlemen. No bias. Pure merit, scored by AI, verified on-chain.

## Key Features

- **Create Tasks** — Post bounties with title, description, evaluation criteria, and reward points
- **Submit Work** — Workers submit a URL + description as proof-of-work
- **AI Evaluation** — GenLayer AI validators score work objectively (0–100) via consensus
- **Detailed Feedback** — Each evaluation returns a score, grade (A–F), feedback, strengths, improvements, and per-criterion scores
- **On-Chain Reputation** — Cumulative leaderboard scores stored permanently on the GenLayer chain
- **Wallet Integration** — Connect via MetaMask (RainbowKit) for identity, while signing happens locally for proper GenLayer "Call" transactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Routing | React Router v6 |
| Wallet UI | RainbowKit, wagmi, viem |
| Contract SDK | genlayer-js v1.1.8 |
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Animations | Custom SVG wave background, glassmorphism UI |


## Network

| Field | Value |
|-------|-------|
| Contract Address | `0xD931392177067735378b26e5EE37851284c19d69` |
| Network | GenLayer Bradbury Testnet |
| Chain ID | `4221` |
| RPC | `https://rpc-bradbury.genlayer.com` |
| Explorer | [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com) |
| Faucet | [testnet-faucet.genlayer.foundation](https://testnet-faucet.genlayer.foundation) |

## Smart Contract Methods

### Write (transactions)

```python
create_task(title: str, description: str, criteria: str, reward_points: int) -> str
submit_work(task_id: str, work_url: str, description: str) -> str
evaluate_submission(sub_id: str) -> str  # triggers AI evaluation (~30-90s)
```

### Read (no gas)

```python
get_task(task_id: str) -> str           # JSON
get_submission(sub_id: str) -> str      # JSON
get_score(sub_id: str) -> int           # 0-100
get_leaderboard_score(address: str) -> int
get_task_count() -> int
get_submission_count() -> int
```

The full Python contract is in [`contracts/proof_of_impact.py`](./contracts/proof_of_impact.py).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Interface (React + Vite)                          │
│  ├── RainbowKit (wallet identity)                       │
│  └── Pages: Home, Task, Submit, Evaluate, Leaderboard   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  genlayer-js SDK                                        │
│  ├── createAccount() → local signing                    │
│  ├── writeContract() → eth_sendRawTransaction (Call)    │
│  └── readContract() → eth_call                          │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  GenLayer Bradbury Testnet                              │
│  ├── ProofOfImpact Contract                             │
│  └── AI Validators (Optimistic Democracy)               │
└─────────────────────────────────────────────────────────┘
```

**Why hybrid signing?** GenLayer requires `eth_sendRawTransaction` for "Call" type transactions. Browser wallets like MetaMask send `eth_sendTransaction` which GenLayer interprets as plain transfers. We use MetaMask for **identity display only** while writes are signed locally via `createAccount()` → producing proper GenLayer "Call" transactions.


## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- A **Web3 wallet** (MetaMask recommended)
- GEN testnet tokens from the [Bradbury faucet](https://testnet-faucet.genlayer.foundation)

### Installation

```bash
git clone https://github.com/nanometa/Proof-of-Impact.git
cd Proof-of-Impact
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
npm run preview
```

## Usage

### 1. Create a Task

Navigate to **`/create`**, fill in:
- **Title** — what you want done
- **Description** — detailed requirements
- **Criteria** — how the AI should evaluate the work (e.g. "Code quality, Documentation, Tests")
- **Reward Points** — bounty amount

### 2. Submit Work

From any open task page, click **Submit Your Work** and provide:
- **Work URL** — link to your repo, gist, or deliverable
- **Description** — explanation of how your work meets the criteria

### 3. Request AI Evaluation

Open the submission page → click **Request AI Evaluation**.

The AI validators take 30–90 seconds to reach consensus. Results include:
- **Score** (0–100)
- **Grade** (A / B / C / D / F)
- **Written feedback**
- **Strengths** and **areas for improvement**
- **Per-criterion scores**

### 4. Check the Leaderboard

Navigate to **`/leaderboard`** and search any address to see their cumulative score.

## Project Structure

```
Proof-of-Impact/
├── contracts/
│   ├── proof_of_impact.py      # GenLayer Intelligent Contract
│   └── contractABI.json        # Contract metadata
├── public/
│   └── logo.svg
├── src/
│   ├── components/             # Reusable UI components
│   ├── context/                # React contexts (Wallet, Toast)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Contract client, utils
│   ├── pages/                  # Route pages
│   ├── App.jsx                 # Routes
│   └── main.jsx                # Entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```


## How AI Evaluation Works

GenLayer's **Optimistic Democracy** mechanism:

1. The user calls `evaluate_submission(sub_id)`
2. Multiple AI validator nodes independently fetch the task + submission and prompt an LLM
3. Each validator scores the work using the **Equivalence Principle** — outputs must agree within a tolerance:
   - Score within ±5 points
   - Grade exact match
   - Per-criterion scores within ±10 points
4. If consensus is reached, the score is finalized on-chain
5. The contributor's `contributor_points` mapping is incremented

The contract code in [`contracts/proof_of_impact.py`](./contracts/proof_of_impact.py) shows the exact prompt and equivalence rules.

## Design

- **Bloomberg Terminal × Web3** aesthetic — dark theme, monospace addresses, neon accent colors
- **Glassmorphism** — translucent cards with backdrop blur
- **Animated SVG wave background** — subtle, interactive, brand-aligned
- **Color system**:
  - `--purple` `#8b5cf6` — primary actions
  - `--blue` `#3b82f6` — info / B grade
  - `--green` `#10b981` — success / A grade
  - `--yellow` `#f59e0b` — warning / C grade
  - `--orange` `#f97316` — D grade
  - `--red` `#ef4444` — error / F grade

## Roadmap

- [ ] Tutorial mode (educational overlays explaining GenLayer architecture)
- [ ] Task detail filters (by reward, criteria, creator)
- [ ] On-chain comments / discussions per task
- [ ] Multi-language UI
- [ ] Integration with Asimov & Studionet for testing

## Contributing

Contributions welcome. Open an issue or pull request.

## License

MIT © 2026 — Built for the GenLayer Hackathon.

## Links

- **GenLayer Docs** — [docs.genlayer.com](https://docs.genlayer.com)
- **GenLayer JS SDK** — [github.com/yeagerai/genlayer-js](https://github.com/yeagerai/genlayer-js)
- **Bradbury Explorer** — [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com)
