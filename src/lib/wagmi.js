import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

export const genlayerStudio = defineChain({
  id: 61999,
  name: 'GenLayer Studio',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: { default: { http: ['https://studio.genlayer.com/api'] } },
  blockExplorers: { default: { name: 'GenLayer Explorer', url: 'https://explorer-studio.genlayer.com' } },
  testnet: true,
})

export const config = createConfig({
  chains: [genlayerStudio],
  connectors: [injected()],
  transports: {
    [genlayerStudio.id]: http('https://studio.genlayer.com/api'),
  },
})
