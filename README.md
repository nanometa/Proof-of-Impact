# Proof of Impact

A decentralized work platform on **GenLayer** where AI validators score contributions on-chain.

## Features

- **Create Tasks** — Post bounties with evaluation criteria and reward points
- **Submit Work** — Workers submit proof-of-work with URLs and descriptions
- **AI Evaluation** — GenLayer AI validators score work objectively via consensus (0-100)
- **Leaderboard** — Cumulative on-chain reputation based on scores
- **RainbowKit Wallet** — Connect with MetaMask or any EVM wallet

## Tech Stack

- React 18 + Vite
- TailwindCSS (dark theme)
- React Router v6
- RainbowKit + wagmi (wallet connection)
- genlayer-js v1.1.8 (contract interaction)

## Contract

| Field | Value |
|-------|-------|
| Address | `0xe8edD92871983af27af5bC15edF6A96265e6a689` |
| Network | GenLayer Studionet |
| Chain ID | 61999 |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | [explorer-studio.genlayer.com](https://explorer-studio.genlayer.com) |

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Contract Methods

### Write (transaction)
- `create_task(title, description, criteria, reward_points)`
- `submit_work(task_id, work_url, description)`
- `evaluate_submission(sub_id)` — triggers AI evaluation (30-90s)

### Read (no gas)
- `get_task(task_id)` → JSON
- `get_submission(sub_id)` → JSON
- `get_score(sub_id)` → int
- `get_leaderboard_score(address)` → int
- `get_task_count()` → int
- `get_submission_count()` → int

## Architecture

```
User → RainbowKit (wallet UI) → MetaMask
         ↓
     genlayer-js SDK → createAccount() → eth_sendRawTransaction
         ↓
     GenLayer Studionet RPC → AI Validators → Consensus → Finalized
```

Wallet connection via RainbowKit is for **identity display only**. All write transactions are signed by an auto-generated local account (required by GenLayer for Type: "Call" transactions).

## License

MIT
