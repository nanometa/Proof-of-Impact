import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

export const genlayerBradbury = defineChain({
  id: 4221,
  name: 'GenLayer Bradbury',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } },
  blockExplorers: { default: { name: 'GenLayer Explorer', url: 'https://explorer-bradbury.genlayer.com' } },
  testnet: true,
})

export const ethereumSepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
  testnet: true,
})

export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
  blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  testnet: true,
})

export const opSepolia = defineChain({
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.optimism.io'] } },
  blockExplorers: {
    default: { name: 'OP Sepolia Explorer', url: 'https://sepolia-optimism.etherscan.io' },
  },
  testnet: true,
})

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] } },
  blockExplorers: { default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' } },
  testnet: true,
})

export const config = createConfig({
  chains: [genlayerBradbury, ethereumSepolia, baseSepolia, opSepolia, arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [genlayerBradbury.id]: http('https://rpc-bradbury.genlayer.com'),
    [ethereumSepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [opSepolia.id]: http('https://sepolia.optimism.io'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
})
