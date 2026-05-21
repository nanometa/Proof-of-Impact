import { createContext, useContext } from 'react'
import { useAccount } from 'wagmi'

const defaultWallet = {
  address: null,
  isConnected: false,
}

const WalletContext = createContext(defaultWallet)

export function WalletProvider({ children }) {
  // Pas besoin — RainbowKit gère tout via WagmiProvider
  return children
}

export function useWallet() {
  try {
    const { address, isConnected } = useAccount()
    return { address: address ?? null, isConnected: !!isConnected }
  } catch {
    return defaultWallet
  }
}
