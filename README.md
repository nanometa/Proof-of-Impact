# Proof of Impact 🌐🤖

**Proof of Impact** is a fully decentralized task outsourcing and evaluation platform powered by **GenLayer AI Smart Contracts**. It allows users to create tasks with specific criteria, accept work submissions, and rely on decentralized AI validators to autonomously grade the work and assign reward points.

![Proof of Impact Platform Preview](./Gemini_Generated_Image_7ysw8o7ysw8o7ysw.png)

## 🚀 Features

- **Decentralized AI Evaluation**: Utilizes GenLayer's AI nodes to fetch real-world data (web pages, repositories) and grade submissions based on custom LLM prompts using the Equivalence Principle.
- **On-Chain Leaderboard**: Seamlessly tracks top contributors and their accrued reputation/points entirely on the blockchain.
- **Web3 Wallet Integration**: Connect seamlessly via MetaMask, powered by `wagmi` and `RainbowKit`.
- **Hybrid Account Abstraction**: Automatically maps Web3 identities to GenLayer's backend using internal burner wallets for zero-friction transactions.
- **Modern UI/UX**: Built with React, Vite, and TailwindCSS for a sleek, responsive, glassmorphism-inspired dark mode aesthetic.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), TailwindCSS, React Router
- **Web3 Integration**: `wagmi`, `RainbowKit`, `viem`
- **GenLayer SDK**: `genlayer-js`
- **Smart Contracts**: Python (GenLayer `gl.Contract`)
- **Deployment**: Vercel

## 📂 Repository Structure

```
├── contracts/               # Python Smart Contracts deployed to GenLayer
│   ├── ProofOfImpact.py     # Main AI Evaluation & Task Logic
│   └── global_leaderboard.py# Read-only Global Leaderboard aggregator
├── src/
│   ├── components/          # Reusable UI components (Navbar, Layout, Spinners)
│   ├── context/             # React Contexts (WalletContext)
│   ├── lib/                 # Utility functions & GenLayer client configuration
│   └── pages/               # Application Routes (Home, Tasks, Leaderboard)
```

## 🧠 How It Works

1. **Create a Task**: A task creator specifies a title, detailed description, evaluation criteria, and a point reward.
2. **Submit Work**: Contributors submit a URL pointing to their completed work (e.g., a GitHub Gist, a raw file, an article).
3. **AI Validation**: GenLayer's non-deterministic AI validators fetch the provided URL, read the content, and compare it against the criteria.
4. **Consensus**: Multiple AI nodes reach consensus on the grade (A-F) and the score (0-100) using the Equivalence Principle.
5. **Reward Allocation**: The system calculates the earned points `(Reward * Score) / 100` and permanently records it on the Leaderboard.

## 💻 Local Development

### Prerequisites

- Node.js (v18+)
- GenLayer Simulator / Network Access
- MetaMask Browser Extension

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/proof-of-impact.git
   cd proof-of-impact
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Smart Contracts:
   Update the `CONTRACT_ADDRESS` inside `src/lib/contract.js` with your deployed GenLayer contract address.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Smart Contract Highlights

The `ProofOfImpact.py` contract relies heavily on GenLayer's standard library. It utilizes `gl.nondet.web.render()` to dynamically read content from external sources and `gl.nondet.exec_prompt()` to interact with the LLM layer natively within the consensus loop.

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
