# Multichain Testnet Architecture

Proof of Impact v4.2 separates three responsibilities:

1. GenLayer Bradbury owns the canonical AI evaluation, score threshold, task state,
   native GEN escrow, payout scheduling, refund scheduling, and reputation updates.
2. The task profile owns the specialized review process: code, research, design,
   community, content, or data.
3. The selected ETH testnet rail records where the task is expected to map once
   an external L2 escrow or bridge module is connected.

This keeps the implementation honest. A task can record that it targets Ethereum
Sepolia, Base Sepolia, OP Sepolia, or Arbitrum Sepolia with native testnet ETH,
but the current contract does not claim that GenLayer automatically transfers
ETH on those chains. Until an L2 escrow module is deployed and connected, native
GEN escrow on GenLayer remains the only automatic settlement path.

## Supported ETH testnet rails

| Network | Chain ID | Token |
| --- | ---: | --- |
| Ethereum Sepolia | `11155111` | ETH |
| Base Sepolia | `84532` | ETH |
| OP Sepolia | `11155420` | ETH |
| Arbitrum Sepolia | `421614` | ETH |

## Why task templates matter

The project is intentionally not a single broad “proof of work” judge. Every
task stores a template, evidence requirements, review focus, and risk flags.
Validators receive those fields in the evaluation prompt, so a code task is
judged against code evidence, a research task against research evidence, and a
community task against reach and anti-spam evidence.

## Next module boundary

The clean next step is a small L2 native ETH escrow contract per supported
testnet. That module should:

- lock ETH against a GenLayer task ID;
- expose deposit, release, refund, and retryable payout paths;
- require an authenticated GenLayer settlement proof or authorized relay before
  release;
- keep failed transfers recoverable;
- emit chain-specific settlement receipts that the frontend can display beside
  the GenLayer verdict.

Until that module exists, the app should continue to label L2 support as
“ETH testnet rail metadata” rather than “automatic L2 payout.”
