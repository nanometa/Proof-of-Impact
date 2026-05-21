import { Outlet, Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <nav className="border-b border-border/50 glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple/20 to-blue/10 border border-purple/20 flex items-center justify-center group-hover:border-purple/40 transition-all">
              <svg className="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-heading font-bold text-lg text-text hidden sm:block">Proof of Impact</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/app" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname.startsWith('/app') || location.pathname.startsWith('/task') || location.pathname === '/create' ? 'text-purple bg-purple/5' : 'text-muted hover:text-text'}`}>Tasks</Link>
            <Link to="/leaderboard" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/leaderboard' ? 'text-purple bg-purple/5' : 'text-muted hover:text-text'}`}>Leaderboard</Link>
            <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
          </div>
        </div>
      </nav>
      <main className="flex-1"><Outlet /></main>
    </div>
  )
}
