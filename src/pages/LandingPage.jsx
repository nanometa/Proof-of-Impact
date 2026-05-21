import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="relative noise">
      <HeroSection />
      <LogoBar />
      <HowItWorks />
      <ScoringSection />
      <EvalPreview />
      <FeaturesGrid />
      <CTASection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-purple w-[500px] h-[500px] -top-40 -left-40" />
      <div className="orb orb-blue w-[400px] h-[400px] top-20 -right-20" />
      <div className="orb orb-cyan w-[300px] h-[300px] -bottom-20 left-1/3" />

      {/* Grid */}
      <div className="absolute inset-0 animated-grid pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass text-sm mb-10 fade-in-up">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span className="text-muted">Live on</span>
          <span className="text-text font-medium">GenLayer Testnet</span>
        </div>

        {/* Heading */}
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-[0.9] tracking-tight fade-in-up" style={{animationDelay:'0.1s'}}>
          <span className="gradient-text">Proof of</span>
          <br />
          <span className="text-text">Impact</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted/80 max-w-2xl mx-auto mb-12 leading-relaxed fade-in-up" style={{animationDelay:'0.2s'}}>
          Submit work. Get scored by AI validators on-chain.
          <br className="hidden sm:block" />
          Build a verifiable reputation — no gatekeepers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in-up" style={{animationDelay:'0.3s'}}>
          <Link
            to="/app"
            className="group relative px-8 py-4 rounded-2xl bg-purple text-white font-semibold text-lg overflow-hidden btn-press"
          >
            <span className="relative z-10 flex items-center gap-2">
              Launch App
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple via-blue to-purple bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{animation:'shimmer 3s linear infinite'}} />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl glass text-text font-medium text-lg hover:border-purple/30 transition-all btn-press"
          >
            How it works
          </a>
        </div>

        {/* Metrics */}
        <div className="mt-20 grid grid-cols-3 max-w-md mx-auto fade-in-up" style={{animationDelay:'0.5s'}}>
          <div className="text-center">
            <p className="font-heading text-3xl font-bold text-text">100%</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">On-Chain</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="font-heading text-3xl font-bold text-text">0–100</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">AI Score</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-3xl font-bold text-text">&lt;90s</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">Consensus</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoBar() {
  return (
    <section className="py-12 border-t border-border/30">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-xs text-muted uppercase tracking-[0.2em] mb-6">Powered by</p>
        <div className="flex items-center justify-center gap-10 sm:gap-16 opacity-50">
          <span className="font-heading text-xl font-bold text-text">GenLayer</span>
          <span className="text-muted">•</span>
          <span className="font-heading text-xl font-bold text-text">GenVM</span>
          <span className="text-muted">•</span>
          <span className="font-heading text-xl font-bold text-text">MetaMask</span>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Create a Task', desc: 'Define work criteria and reward points. Anyone can post.', color: '#8b5cf6' },
    { num: '02', title: 'Submit Work', desc: 'Share your URL and describe what you built.', color: '#3b82f6' },
    { num: '03', title: 'AI Evaluates', desc: 'GenLayer validators score objectively via consensus.', color: '#06b6d4' },
    { num: '04', title: 'Earn Reputation', desc: 'Your score goes on-chain permanently.', color: '#10b981' },
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-purple text-sm font-medium uppercase tracking-wider mb-3">Process</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative group">
              {/* Connector line */}
              {i < 3 && <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />}
              <div className="relative bg-surface/50 border border-border rounded-2xl p-6 card-glow h-full">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-xs text-muted/50">{step.num}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{backgroundColor:`${step.color}10`, border:`1px solid ${step.color}30`}}>
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: step.color}} />
                </div>
                <h3 className="font-heading font-semibold text-text text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScoringSection() {
  const grades = [
    { grade: 'A', range: '90–100', color: '#10b981', pct: 95 },
    { grade: 'B', range: '80–89', color: '#3b82f6', pct: 84 },
    { grade: 'C', range: '70–79', color: '#f59e0b', pct: 74 },
    { grade: 'D', range: '60–69', color: '#f97316', pct: 64 },
    { grade: 'F', range: '0–59', color: '#ef4444', pct: 40 },
  ]

  return (
    <section className="py-24 sm:py-32 border-t border-border/30 relative overflow-hidden">
      <div className="orb orb-purple w-[300px] h-[300px] -right-20 top-20" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-purple text-sm font-medium uppercase tracking-wider mb-3">Scoring</p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-6">AI-Powered Grading</h2>
            <p className="text-muted text-lg leading-relaxed mb-8">
              Multiple AI validators independently evaluate your work. They must reach consensus — ensuring fair, unbiased scoring every time.
            </p>
            <div className="glass rounded-xl p-4 inline-block">
              <p className="text-sm text-muted">
                Score <span className="text-text font-mono">85</span> + <span className="text-text font-mono">92</span> + <span className="text-text font-mono">70</span> = <span className="text-purple font-mono font-bold">247 pts</span> total
              </p>
              <p className="text-xs text-muted/60 mt-1">Points are cumulative across all submissions</p>
            </div>
          </div>

          {/* Right: Grade cards */}
          <div className="space-y-3">
            {grades.map((g) => (
              <div key={g.grade} className="flex items-center gap-4 glass rounded-xl p-4 group hover:border-[color:var(--c)]/30 transition-all" style={{'--c': g.color}}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-bold text-xl shrink-0" style={{color: g.color, backgroundColor:`${g.color}12`, border:`1px solid ${g.color}25`}}>
                  {g.grade}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text font-medium">Score {g.range}</span>
                  </div>
                  <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{width:`${g.pct}%`, backgroundColor: g.color}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function EvalPreview() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-purple text-sm font-medium uppercase tracking-wider mb-3">Output</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">What You Get</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">Every evaluation produces a detailed, verifiable report stored permanently on-chain.</p>
        </div>

        {/* Mock evaluation card */}
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            {/* Subtle beam effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple/40 to-transparent" />

            {/* Score + Grade row */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="relative">
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e2e" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="5"
                    strokeDasharray="263.9" strokeDashoffset="26.4" strokeLinecap="round"
                    style={{filter:'drop-shadow(0 0 8px #10b98140)'}} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-2xl text-green">90</span>
              </div>
              <div className="text-left">
                <span className="inline-block px-4 py-1.5 rounded-lg font-heading font-bold text-2xl" style={{color:'#10b981',backgroundColor:'#10b98112',border:'1px solid #10b98125'}}>A</span>
                <p className="text-sm text-muted mt-2">Exceptional Work</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-bg/50 rounded-xl p-5 border border-border/50 mb-6">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">AI Feedback</p>
              <p className="text-text/80 italic leading-relaxed">"Excellent implementation with clean code structure, comprehensive documentation, and well-thought-out error handling."</p>
            </div>

            {/* Strengths / Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-bg/50 rounded-xl p-5 border border-border/50">
                <p className="text-xs uppercase tracking-wider mb-3" style={{color:'#10b981'}}>Strengths</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2"><span className="text-green mt-0.5">✓</span>Clean architecture</li>
                  <li className="flex items-start gap-2"><span className="text-green mt-0.5">✓</span>Thorough testing</li>
                  <li className="flex items-start gap-2"><span className="text-green mt-0.5">✓</span>Good documentation</li>
                </ul>
              </div>
              <div className="bg-bg/50 rounded-xl p-5 border border-border/50">
                <p className="text-xs uppercase tracking-wider mb-3" style={{color:'#f97316'}}>Improvements</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2"><span className="text-orange mt-0.5">→</span>Edge case handling</li>
                  <li className="flex items-start gap-2"><span className="text-orange mt-0.5">→</span>Performance tuning</li>
                </ul>
              </div>
            </div>

            {/* Verified badge */}
            <div className="flex items-center justify-center pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 text-purple/70 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified by GenLayer Consensus
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesGrid() {
  const features = [
    { title: 'Zero Bias', desc: 'AI evaluates against objective criteria. No personal opinions.', icon: (
      <svg className="w-7 h-7 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    )},
    { title: 'On-Chain Proof', desc: 'Every score stored permanently. Verifiable by anyone.', icon: (
      <svg className="w-7 h-7 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.686-3.374l1.757-1.757a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
      </svg>
    )},
    { title: 'Multi-Validator', desc: 'Consensus between multiple AI validators. Not a single opinion.', icon: (
      <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )},
    { title: 'Clear Criteria', desc: 'Know exactly what is expected before you start working.', icon: (
      <svg className="w-7 h-7 text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    )},
    { title: 'Stack Reputation', desc: 'Scores accumulate over time. Build your track record.', icon: (
      <svg className="w-7 h-7 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    )},
    { title: 'Permissionless', desc: 'No sign-ups, no approvals. Connect wallet and go.', icon: (
      <svg className="w-7 h-7 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67" />
      </svg>
    )},
  ]

  return (
    <section className="py-24 sm:py-32 border-t border-border/30 relative overflow-hidden">
      <div className="orb orb-blue w-[400px] h-[400px] -left-40 bottom-0" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-purple text-sm font-medium uppercase tracking-wider mb-3">Why</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text">Built Different</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 card-glow">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border/80 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-heading font-semibold text-text text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 sm:py-32 border-t border-border/30 relative overflow-hidden">
      <div className="orb orb-purple w-[500px] h-[500px] left-1/2 -translate-x-1/2 -bottom-60" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-6">
          Ready to Prove<br /><span className="gradient-text-static">Your Impact?</span>
        </h2>
        <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
          Connect your wallet, find a task, submit your work, and let AI validators recognize your contribution.
        </p>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-purple text-white font-semibold text-lg shadow-2xl shadow-purple/30 hover:shadow-purple/50 transition-all hover:scale-[1.02] btn-press"
        >
          Launch App
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        {/* Contract info */}
        <div className="mt-16 pt-8 border-t border-border/30 space-y-2">
          <p className="text-xs text-muted/60 font-mono">0xe8edD92871983af27af5bC15edF6A96265e6a689</p>
          <p className="text-xs text-muted/40">
            GenLayer Studio Testnet •{' '}
            <a href="https://explorer-studio.genlayer.com" target="_blank" rel="noopener noreferrer" className="text-purple/60 hover:text-purple transition-colors">
              Explorer ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
