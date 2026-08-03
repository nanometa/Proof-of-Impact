# Multichain Testnet Architecture

Proof of Impact v4.3 separates settlement across two layers:

1. **GenLayer Bradbury** owns the canonical task state, AI evaluation, exact score threshold, winner selection, payout/refund readiness, and reputation updates.
2. **L2TaskEscrow** owns the real native ETH custody and atomic release/refund on each supported ETH testnet.
3. The frontend coordinates both legs: it first locks ETH in the selected L2 escrow, then registers the GenLayer task with the escrow address, escrow id, deposit transaction, and amount.

This avoids pretending that a GenLayer write automatically moves ETH on another chain. GenLayer decides who is eligible; the L2 escrow performs the actual transfer.

## Supported ETH testnets

| Network | Chain ID | Token | Escrow |
| --- | ---: | --- | --- |
| Ethereum Sepolia | `11155111` | ETH | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` |
| Base Sepolia | `84532` | ETH | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` |
| OP Sepolia | `11155420` | ETH | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` |
| Arbitrum Sepolia | `421614` | ETH | `0xc49fD9D21Deb2f5cbc377Aa21980E3856D4A6931` |

## Settlement lifecycle

1. Creator chooses an ETH testnet and bounty amount.
2. Frontend switches MetaMask to that testnet and calls `L2TaskEscrow.createEscrow(...)` with native ETH.
3. Frontend switches back to Bradbury and calls `TaskManager.create_task_with_external_eth_escrow(...)`.
4. GenLayer validators evaluate evidence with the task template and exact payout threshold.
5. If a submission qualifies, GenLayer marks the task `external_payout_ready`.
6. The client calls `L2TaskEscrow.release(...)`; if the transfer fails, the escrow stays funded and retryable.
7. The client records the successful L2 transaction on GenLayer with `record_external_payout(...)`.

Expired tasks follow the same discipline: GenLayer first marks `external_refund_ready`, then the L2 refund must succeed before GenLayer records `external_refunded`.

## Why task templates matter

The project is intentionally not a single broad proof-of-work judge. Every task stores a template, evidence requirements, review focus, and risk flags. Validators receive those fields in the evaluation prompt, so a code task is judged against code evidence, a research task against research evidence, and a community task against reach and anti-spam evidence.

## Failure handling

- A failed L2 payout reverts and keeps ETH locked for retry.
- A failed L2 refund reverts and keeps ETH locked for retry.
- GenLayer accounting is not reduced until a successful L2 settlement transaction is recorded.
- Duplicate escrow ids, unauthorized settler calls, under-threshold releases, and double settlement are rejected by the EVM escrow tests.
