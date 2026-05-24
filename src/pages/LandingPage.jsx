import { Link } from 'react-router-dom'

const logos = [
  { name: 'ZKsync', letter: 'Z', url: 'https://zksync.io' },
  { name: 'Caldera', letter: 'C', url: 'https://www.caldera.xyz' },
  { name: 'io.net', letter: 'I', url: 'https://io.net' },
  { name: 'Nansen', letter: 'N', url: 'https://www.nansen.ai' },
  { name: 'Autonomys', letter: 'A', url: 'https://autonomys.xyz' },
  { name: 'Etherisc', letter: 'E', url: 'https://etherisc.com' },
  { name: 'DIA', letter: 'D', url: 'https://www.diadata.org' },
  { name: 'Heurist', letter: 'H', url: 'https://heurist.ai' },
  { name: 'Atoma', letter: 'A', url: 'https://atoma.network' },
  { name: 'Spheron', letter: 'S', url: 'https://spheron.network' },
  { name: 'Hyperbolic', letter: 'H', url: 'https://hyperbolic.xyz' },
  { name: 'Peersyst', letter: 'P', url: 'https://peersyst.com' },
  { name: 'PredX', letter: 'P', url: 'https://predx.ai' },
  { name: 'Provably', letter: 'P', url: 'https://provably.ai' },
  { name: 'Chasm', letter: 'C', url: 'https://chasm.net' },
  { name: 'Morpheus', letter: 'M', url: 'https://mor.org' },
  { name: 'Comput3', letter: 'C', url: 'https://comput3.ai' },
  { name: 'Aleph Cloud', letter: 'A', url: 'https://aleph.cloud' },
  { name: 'LibertAI', letter: 'L', url: 'https://libertai.io' },
  { name: 'Arrington Capital', letter: 'A', url: 'https://arringtoncapital.com' },
  { name: 'North Island Ventures', letter: 'N', url: 'https://www.northisland.ventures' },
  { name: 'Maelstrom', letter: 'M', url: 'https://maelstrom.fund' }
]

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between overflow-visible">
      {/* Hero Content (vertically centered in remaining space via flex-1) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative py-12">
        {/* Headline */}
        <h1 className="font-heading font-normal leading-[1.02] tracking-[-0.024em] select-none text-[64px] sm:text-[120px] md:text-[170px] lg:text-[220px]">
          <span className="text-foreground">Proof of </span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Impact
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-hero-sub text-base sm:text-lg leading-8 max-w-2xl mt-[9px] opacity-80 font-sans">
          Submit work Get scored by AI validators onchain <br className="hidden sm:inline" /> Build a verifiable reputation no gatekeepers
        </p>

        {/* CTA */}
        <Link
          to="/app"
          className="heroSecondary px-[29px] py-[24px] mt-[25px] rounded-2xl text-lg font-semibold tracking-wide"
        >
          Launch App
        </Link>
      </main>

      {/* Logo Marquee (pinned to bottom, pb-10) */}
      <footer className="w-full pb-10">
        <div className="w-full px-8 flex flex-col md:flex-row items-center gap-12">
          {/* Left side: static text (clickable link) */}
          <a
            href="https://www.genlayer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/45 hover:text-purple text-[11px] font-semibold uppercase tracking-wider leading-relaxed text-center md:text-left shrink-0 transition-colors"
          >
            Ecosystem & infrastructure <br /> supporting GenLayer
          </a>

          {/* Right side: infinite scrolling marquee */}
          <div className="flex-1 overflow-hidden relative w-full">
            {/* Fade masks for smooth edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-track">
              {/* Group 1 */}
              <div className="flex gap-16 pr-16 shrink-0">
                {logos.map((logo, idx) => (
                  <a
                    key={`g1-${idx}`}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-85 transition-opacity group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg liquid-glass flex items-center justify-center text-xs font-bold text-foreground shrink-0 select-none group-hover:scale-105 transition-transform">
                      {logo.letter}
                    </div>
                    <span className="text-base md:text-lg font-semibold text-foreground tracking-wide whitespace-nowrap group-hover:text-purple transition-colors">
                      {logo.name}
                    </span>
                  </a>
                ))}
              </div>
              {/* Group 2 */}
              <div className="flex gap-16 pr-16 shrink-0" aria-hidden="true">
                {logos.map((logo, idx) => (
                  <a
                    key={`g2-${idx}`}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-85 transition-opacity group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg liquid-glass flex items-center justify-center text-xs font-bold text-foreground shrink-0 select-none group-hover:scale-105 transition-transform">
                      {logo.letter}
                    </div>
                    <span className="text-base md:text-lg font-semibold text-foreground tracking-wide whitespace-nowrap group-hover:text-purple transition-colors">
                      {logo.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
