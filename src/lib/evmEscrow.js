import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  encodeFunctionData,
  http,
  keccak256,
  parseEther,
  toBytes,
} from 'viem'
import { ACTIVE_DEPLOYMENT } from './deployments'
import { getPayoutNetwork } from './taskProfiles'

export const L2_TASK_ESCROW_ABI = [
  {
    type: 'function',
    name: 'createEscrow',
    stateMutability: 'payable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'refundAfter', type: 'uint64' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'release',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'bytes32' },
      { name: 'winner', type: 'address' },
      { name: 'genlayerSettlementRef', type: 'bytes32' },
      { name: 'score', type: 'uint16' },
      { name: 'threshold', type: 'uint16' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'refund',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getEscrow',
    stateMutability: 'view',
    inputs: [{ name: 'escrowId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'refundAfter', type: 'uint64' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'winner', type: 'address' },
          { name: 'genlayerSettlementRef', type: 'bytes32' },
        ],
      },
    ],
  },
]

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is required for ETH testnet escrow.')
  }
  return window.ethereum
}

function toHexChainId(chainId) {
  return `0x${Number(chainId).toString(16)}`
}

function getChain(chainId) {
  const network = getPayoutNetwork(chainId)
  return defineChain({
    id: Number(network.chainId),
    name: network.name,
    nativeCurrency: {
      name: network.nativeToken,
      symbol: network.nativeToken,
      decimals: 18,
    },
    rpcUrls: { default: { http: [network.rpcUrl] } },
    blockExplorers: { default: { name: network.name, url: network.explorerUrl } },
    testnet: true,
  })
}

export function getL2EscrowAddress(chainId) {
  const envName = `VITE_L2_ESCROW_${Number(chainId)}`
  const envValue = String(import.meta.env[envName] || '').trim()
  const deployed = String(ACTIVE_DEPLOYMENT.l2Escrows?.[Number(chainId)] || '').trim()
  if (ADDRESS_PATTERN.test(envValue)) return envValue
  if (ADDRESS_PATTERN.test(deployed)) return deployed
  throw new Error(`L2 escrow contract is not configured for chain ${chainId}.`)
}

export function makeEscrowId(seed) {
  return keccak256(toBytes(seed))
}

export function makeSettlementRef(taskId, subId, score, threshold) {
  return keccak256(toBytes(`${taskId}:${subId}:${score}:${threshold}`))
}

export function isExternalEthTask(task) {
  return task?.escrow_kind === 'external_evm_escrow'
}

export async function ensureEvmChain(chainId) {
  const provider = getProvider()
  const network = getPayoutNetwork(chainId)

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHexChainId(chainId) }],
    })
  } catch (error) {
    if (error?.code !== 4902) throw error
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: toHexChainId(chainId),
          chainName: network.name,
          nativeCurrency: {
            name: network.nativeToken,
            symbol: network.nativeToken,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorerUrl],
        },
      ],
    })
  }
}

async function getWalletClient(chainId) {
  const chain = getChain(chainId)
  const provider = getProvider()
  const [account] = await provider.request({ method: 'eth_requestAccounts' })
  return createWalletClient({
    account,
    chain,
    transport: custom(provider),
  })
}

export async function createL2TaskEscrow({ chainId, amountEth, refundAfter, seed }) {
  await ensureEvmChain(chainId)
  const chain = getChain(chainId)
  const address = getL2EscrowAddress(chainId)
  const escrowId = makeEscrowId(seed)
  const value = parseEther(String(amountEth).trim())
  const walletClient = await getWalletClient(chainId)
  const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })

  const hash = await walletClient.sendTransaction({
    to: address,
    value,
    data: encodeFunctionData({
      abi: L2_TASK_ESCROW_ABI,
      functionName: 'createEscrow',
      args: [escrowId, BigInt(refundAfter)],
    }),
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return {
    address,
    amountWei: value.toString(),
    escrowId,
    hash,
  }
}

export async function releaseL2TaskEscrow({ task, submission, score, threshold }) {
  const chainId = Number(task.payout_chain_id)
  await ensureEvmChain(chainId)
  const chain = getChain(chainId)
  const walletClient = await getWalletClient(chainId)
  const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })
  const settlementRef = makeSettlementRef(task.task_id, submission.sub_id, score, threshold)

  const hash = await walletClient.writeContract({
    address: task.external_escrow_contract,
    abi: L2_TASK_ESCROW_ABI,
    functionName: 'release',
    args: [
      task.external_escrow_id,
      submission.worker,
      settlementRef,
      Number(score),
      Number(threshold),
    ],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

export async function refundL2TaskEscrow(task) {
  const chainId = Number(task.payout_chain_id)
  await ensureEvmChain(chainId)
  const chain = getChain(chainId)
  const walletClient = await getWalletClient(chainId)
  const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })

  const hash = await walletClient.writeContract({
    address: task.external_escrow_contract,
    abi: L2_TASK_ESCROW_ABI,
    functionName: 'refund',
    args: [task.external_escrow_id],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}
