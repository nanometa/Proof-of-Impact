import { createContext, useContext, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { setWalletAddress } from '../lib/contract'

const defaultWallet = {
  address: null,
  isConnected: false,
}

const WalletContext = createContext(defaultWallet)

export function WalletProvider({ children }) {
  const { address } = useAccount()
  
  useEffect(() => {
    setWalletAddress(address || null)
  }, [address])

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
