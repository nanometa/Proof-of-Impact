import { Outlet, Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Waves } from '@/components/ui/wave-background.jsx'
import { GlassFilter } from '@/components/ui/liquid-glass.jsx'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col font-sans">
      <GlassFilter />

      {/* Dynamic Interactive Wave Background */}
      <Waves
        className="z-0 pointer-events-none"
        position="fixed"
        strokeColor="rgba(139, 92, 246, 0.4)"
        backgroundColor="transparent"
      />

      {/* Blurred Overlay Shape (global backdrop glow) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none z-10" />

      {/* Content wrapper z-20 above video and overlay blur */}
      <div className="relative z-20 flex-1 flex flex-col justify-between overflow-visible">
        {/* Navbar */}
        <header className="w-full flex flex-col">
          <nav className="w-full py-5 px-8 grid grid-cols-3 items-center">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2.5 group justify-self-start">
              <img
                src="/logo.svg"
                alt="Proof of Impact Logo"
                className="w-12 h-12 object-contain"
              />
            </Link>

            {/* Center: Nav Items */}
            <div className="hidden md:flex items-center gap-8 justify-self-center">
              <Link
                to="/app"
                className={`font-medium transition-colors ${
                  location.pathname === '/app' ||
                  location.pathname.startsWith('/task') ||
                  location.pathname === '/create'
                    ? 'text-purple font-semibold'
                    : 'text-foreground/90 hover:text-foreground'
                }`}
              >
                Tasks
              </Link>
              <Link
                to="/leaderboard"
                className={`font-medium transition-colors ${
                  location.pathname === '/leaderboard'
                    ? 'text-purple font-semibold'
                    : 'text-foreground/90 hover:text-foreground'
                }`}
              >
                Leaderboard
              </Link>
            </div>

            {/* Right: Connect Wallet Custom Button */}
            <div className="justify-self-end">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="heroSecondary rounded-full px-4 py-2 text-sm font-medium transition-all"
                            >
                              Connect Wallet
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="bg-red/80 hover:bg-red text-white rounded-full px-4 py-2 text-sm font-medium transition-all"
                            >
                              Wrong Network
                            </button>
                          )
                        }

                        return (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="heroSecondary rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all"
                            >
                              {chain.hasIcon && chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-3.5 h-3.5 rounded-full"
                                />
                              )}
                              {chain.name}
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="heroSecondary rounded-full px-4 py-2 text-sm font-medium transition-all"
                            >
                              {account.displayName}
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </nav>


        </header>

        {/* Dynamic page content */}
        <main className="flex-1 flex flex-col relative z-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
