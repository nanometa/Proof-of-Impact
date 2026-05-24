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

export const config = createConfig({
  chains: [genlayerBradbury],
  connectors: [injected()],
  transports: {
    [genlayerBradbury.id]: http('https://rpc-bradbury.genlayer.com'),
  },
})
