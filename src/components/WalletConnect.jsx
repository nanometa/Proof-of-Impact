import { useState } from 'react'
import { importAndVerify } from '../lib/contract'
import { truncateAddress } from '../lib/utils'

export default function WalletConnect({ onConnected }) {
  const [step, setStep] = useState(1) // 1=connect metamask, 2=enter key
  const [metaMaskAddress, setMetaMaskAddress] = useState(null)
  const [privateKey, setPrivateKey] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function connectMetaMask() {
    if (!window.ethereum) {
      setError('MetaMask not found. Install it first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setMetaMaskAddress(accounts[0])
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    setError(null)
    try {
      const acc = importAndVerify(privateKey, metaMaskAddress)
      onConnected(acc.address)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple/20 to-blue/10 border border-purple/20 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-text">Proof of Impact</h1>
          <p className="text-sm text-muted mt-1">Connect to GenLayer Studio</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {step === 1 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-text mb-2">Step 1: Connect MetaMask</h2>
              <p className="text-sm text-muted mb-6">Link your MetaMask wallet to identify your address.</p>
              <button
                onClick={connectMetaMask}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple hover:bg-purple/90 text-white font-medium transition-all disabled:opacity-50 btn-press"
              >
                {loading ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-lg font-semibold text-text mb-2">Step 2: Import Private Key</h2>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg border border-border mb-4">
                <div className="w-2 h-2 rounded-full bg-green" />
                <span className="font-mono text-sm text-text/80">{truncateAddress(metaMaskAddress)}</span>
                <span className="text-xs text-muted ml-auto">MetaMask</span>
              </div>

              <p className="text-sm text-muted mb-4">
                GenLayer requires local signing for contract calls. Paste your private key below — it stays in your browser only.
              </p>

              <input
                type="password"
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && privateKey && handleImport()}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text font-mono text-sm placeholder-muted/40 focus:border-purple/50 mb-3"
                autoFocus
              />

              <button
                onClick={handleImport}
                disabled={!privateKey}
                className="w-full py-3 rounded-xl bg-purple hover:bg-purple/90 text-white font-medium disabled:opacity-40 transition-all btn-press mb-4"
              >
                Import & Connect
              </button>

              <div className="bg-yellow/5 border border-yellow/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow/80">
                  ⚠️ Testnet only — never use a mainnet private key here.
                </p>
              </div>

              <details className="text-xs text-muted">
                <summary className="cursor-pointer hover:text-text transition-colors">How to export from MetaMask</summary>
                <p className="mt-2 pl-3 border-l border-border">
                  MetaMask → ⋮ menu → Account Details → Show Private Key → Enter password → Copy
                </p>
              </details>
            </>
          )}

          {error && <p className="text-red text-sm mt-3">{error}</p>}
        </div>
      </div>
    </div>
  )
}
