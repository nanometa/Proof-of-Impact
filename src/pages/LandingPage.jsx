import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ACTIVE_DEPLOYMENT } from '../lib/deployments'

const CONTRACT_ADDRESS = ACTIVE_DEPLOYMENT.proofOfImpact

const ecosystemLogos = [
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
  { name: 'Provably', letter: 'P', url: 'https://provably.ai' },
  { name: 'Chasm', letter: 'C', url: 'https://chasm.net' },
  { name: 'Morpheus', letter: 'M', url: 'https://mor.org' },
  { name: 'Comput3', letter: 'C', url: 'https://comput3.ai' },
  { name: 'Aleph Cloud', letter: 'A', url: 'https://aleph.cloud' },
  { name: 'LibertAI', letter: 'L', url: 'https://libertai.io' },
  { name: 'Arrington Capital', letter: 'A', url: 'https://arringtoncapital.com' },
  { name: 'North Island Ventures', letter: 'N', url: 'https://www.northisland.ventures' },
  { name: 'Maelstrom', letter: 'M', url: 'https://maelstrom.fund' },
]

const steps = [
  {
    number: '01',
    title: 'Create the task',
    description:
      'Set the work criteria, deadline, reward type, and the exact score required for payout.',
  },
  {
    number: '02',
    title: 'Submit proof',
    description:
      'Contributors complete the work and submit a public URL as verifiable evidence.',
  },
  {
    number: '03',
    title: 'AI validators evaluate',
    description:
      'Independent GenLayer validators fetch the evidence and score it against the task criteria.',
  },
  {
    number: '04',
    title: 'Settle onchain',
    description:
      'Consensus finalizes the score, feedback, reputation, and when qualified unlocks the L2 ETH payout.',
  },
]

const proofFields = [
  'Canonical score from 0 to 100',
  'Letter grade and actionable feedback',
  'Strengths, improvements, and risk flags',
  'Payout decision bound to the task threshold',
]

const taskTemplates = ['Code', 'Research', 'Design', 'Community', 'Content', 'Data']
const payoutRails = ['Sepolia', 'Base Sepolia', 'OP Sepolia', 'Arbitrum Sepolia']

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}
function CheckIcon() {
  return <span aria-hidden="true">✓</span>
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false)

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="landing-page flex-1">
      <section className="landing-brand-intro px-6" aria-label="Proof of Impact">
        <h1 className="landing-brand-title font-heading text-[64px] font-normal leading-[1.02] tracking-[-0.024em] sm:text-[120px] md:text-[170px] lg:text-[220px]">
          <span>Proof of </span>
          <span className="landing-brand-impact">Impact</span>
        </h1>
        <a className="landing-scroll-cue" href="#product-story">
          Discover the platform <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section
        id="product-story"
        className="relative scroll-mt-20 px-5 pb-12 pt-5 sm:px-8 lg:px-12 lg:pb-16 lg:pt-7"
      >
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />

        <div className="relative mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
          <div className="max-w-3xl">
            <div className="landing-eyebrow mb-5">
              <span className="landing-status-dot" />
              Live on GenLayer Bradbury Testnet
              <span className="landing-version">v{ACTIVE_DEPLOYMENT.version}</span>
            </div>

            <h1 className="font-heading text-[52px] font-medium leading-[0.96] tracking-[-0.055em] sm:text-[70px] lg:text-[84px]">
              Work that
              <span className="landing-gradient-text block">proves itself.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-foreground/66 sm:text-lg sm:leading-8">
              Proof of Impact turns submitted work into verifiable onchain outcomes.
              AI validators evaluate the evidence, reach consensus, and release rewards
              only when the task&apos;s exact payout threshold is met.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/app"
                className="landing-primary-button rounded-2xl px-7 py-4 text-center text-base font-semibold"
              >
                Explore open tasks <ArrowIcon />
              </Link>
              <a
                href="#how-it-works"
                className="heroSecondary rounded-2xl px-7 py-4 text-center text-base font-semibold"
              >
                See how it works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-foreground/50">
              <span className="flex items-center gap-2">
                <CheckIcon /> Real L2 ETH escrow
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> AI consensus
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Onchain reputation
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon /> Template-based review
              </span>
            </div>
          </div>

          <div className="landing-console-wrap">
            <div className="landing-console">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/35">
                    Validator consensus
                  </p>
                  <p className="mt-1 font-medium text-foreground/90">Submission #0042</p>
                </div>
                <span className="landing-live-pill">Finalized</span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="text-sm text-foreground/45">Canonical score</p>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="font-heading text-6xl font-semibold tracking-[-0.06em]">86</span>
                      <span className="pb-2 text-lg text-foreground/35">/100</span>
                    </div>
                  </div>
                  <div className="landing-grade">A</div>
                </div>

                <div className="mt-7">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-foreground/45">Payout threshold</span>
                    <span className="font-mono text-foreground/75">70 / 100</span>
                  </div>
                  <div className="landing-score-track">
                    <div className="landing-score-fill" />
                    <div className="landing-threshold-marker">
                      <span>70</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-2">
                  {['Validator 01', 'Validator 02', 'Validator 03'].map((validator) => (
                    <div className="landing-validator" key={validator}>
                      <span className="landing-validator-check">✓</span>
                      <span>{validator}</span>
                    </div>
                  ))}
                </div>

                <div className="landing-payout mt-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/60">
                      Consensus result
                    </p>
                    <p className="mt-1 font-semibold text-emerald-100">Qualifies for payout</p>
                  </div>
                  <span className="text-2xl text-emerald-300">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
            <div>
              <p className="landing-section-label">How it works</p>
              <h2 className="mt-4 max-w-md font-heading text-4xl font-medium leading-[1.06] tracking-[-0.04em] sm:text-5xl">
                From proof of work to proof of impact.
              </h2>
              <p className="mt-4 max-w-sm text-base leading-7 text-foreground/55">
                One transparent flow connects creators, contributors, independent
                validators, and onchain settlement.
              </p>
            </div>

            <div className="landing-steps">
              {steps.map((step) => (
                <article className="landing-step" key={step.number}>
                  <span className="font-mono text-xs text-purple">{step.number}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                    <p className="mt-2 max-w-lg leading-7 text-foreground/52">
                      {step.description}
                    </p>
                  </div>
                  <span className="landing-step-dot" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-2">
          <article className="landing-feature-card landing-feature-purple">
            <span className="landing-card-index">01 / Funded work</span>
            <div>
              <h3 className="font-heading text-3xl font-medium tracking-[-0.035em]">
                Rewards secured before work begins.
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/58">
                Native ETH is locked in the selected L2 escrow before a funded
                task is created. It can only move to a qualifying contributor or
                return to the creator after expiry.
              </p>
            </div>
            <div className="landing-escrow-flow">
              <div>
                <span>Creator</span>
                <strong>Funds task</strong>
              </div>
              <span className="landing-flow-line" />
              <div className="landing-escrow-core">ETH</div>
              <span className="landing-flow-line" />
              <div className="text-right">
                <span>Contributor</span>
                <strong>Gets paid</strong>
              </div>
            </div>
          </article>

          <article className="landing-feature-card landing-feature-blue">
            <span className="landing-card-index">02 / Reputation work</span>
            <div>
              <h3 className="font-heading text-3xl font-medium tracking-[-0.035em]">
                Credibility that travels onchain.
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/58">
                Reputation tasks make useful work visible even without a bounty.
                Every finalized result adds verifiable points to the integrated
                leaderboard.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['01', '0x7F…29B', '980'],
                ['02', '0x31…A8E', '840'],
                ['03', '0xB4…619', '760'],
              ].map(([rank, wallet, points]) => (
                <div className="landing-rank" key={rank}>
                  <span>#{rank}</span>
                  <strong>{wallet}</strong>
                  <small>{points} pts</small>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="landing-feature-card">
            <span className="landing-card-index">03 / Specialized review</span>
            <div>
              <h3 className="font-heading text-3xl font-medium tracking-[-0.035em]">
                Each task now carries its own review template.
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/58">
                Proof of Impact is no longer a single generic proof-of-work judge.
                Creators choose a template, and validators evaluate against that
                category&apos;s evidence requirements, review focus, and risk flags.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {taskTemplates.map((item) => (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="landing-feature-card">
            <span className="landing-card-index">04 / Real ETH testnet escrow</span>
            <div>
              <h3 className="font-heading text-3xl font-medium tracking-[-0.035em]">
                ETH is locked before the task goes live.
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground/58">
                The GenLayer verdict remains canonical, while native ETH is held
                in a dedicated escrow on Sepolia, Base Sepolia, OP Sepolia, or
                Arbitrum Sepolia. Failed release/refund transfers stay retryable.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {payoutRails.map((item) => (
                <span className="rounded-2xl border border-[#0ea5e9]/25 bg-[#0ea5e9]/10 px-3 py-2 text-xs font-semibold text-[#0ea5e9]" key={item}>
                  {item} ETH
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-12 lg:pb-16">
        <div className="landing-threshold-section mx-auto grid max-w-[1180px] gap-7 overflow-hidden rounded-[26px] p-6 sm:p-7 lg:grid-cols-[1fr_0.9fr] lg:p-8">
          <div>
            <p className="landing-section-label">Threshold-bound consensus</p>
            <h2 className="mt-4 font-heading text-3xl font-medium leading-[1.08] tracking-[-0.04em] sm:text-4xl">
              Validators agree on the decision—not just the score.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-foreground/58">
              Every task&apos;s exact payout threshold is included in evaluation.
              Validators independently decide whether the score qualifies, then
              consensus requires them to agree on that payout outcome.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {proofFields.map((field) => (
                <li className="flex gap-3 text-sm leading-6 text-foreground/70" key={field}>
                  <span className="landing-mini-check">✓</span>
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-boundary-test">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Boundary test</span>
              <span className="font-mono text-xs text-foreground/38">threshold = 70</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="landing-boundary-score landing-boundary-fail">
                <span>Score</span>
                <strong>69</strong>
                <small>Does not qualify</small>
              </div>
              <div className="landing-boundary-score landing-boundary-pass">
                <span>Score</span>
                <strong>70</strong>
                <small>Qualifies for payout</small>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <span className="landing-code-dot" />
              <p className="font-mono text-xs leading-5 text-foreground/48">
                Exact cutoff behavior verified by the direct contract test suite.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto max-w-[1180px] text-center">
          <p className="landing-section-label">Deployed and verifiable</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-heading text-4xl font-medium leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            Every meaningful action leaves an onchain trail.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-foreground/55">
            Tasks, submissions, scores, leaderboard updates, deposits, payouts,
            and refunds are recorded through the deployed Bradbury contracts.
          </p>

          <div className="landing-contract mx-auto mt-6 max-w-2xl">
            <div className="min-w-0 text-left">
              <span className="text-xs uppercase tracking-[0.18em] text-foreground/35">
                ProofOfImpact v{ACTIVE_DEPLOYMENT.version}
              </span>
              <p className="mt-2 truncate font-mono text-sm text-foreground/80 sm:text-base">
                {CONTRACT_ADDRESS}
              </p>
            </div>
            <button
              type="button"
              onClick={copyContract}
              className="heroSecondary shrink-0 rounded-xl px-4 py-2.5 text-sm"
              aria-label="Copy Proof of Impact contract address"
            >
              {copied ? 'Copied ✓' : 'Copy address'}
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 pb-6 sm:px-8 lg:px-12">
        <div className="landing-final-cta mx-auto max-w-[1180px] rounded-[28px] px-7 py-11 text-center sm:px-12 lg:py-12">
          <p className="landing-section-label">Proof beats promises</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-medium leading-[1.04] tracking-[-0.05em] sm:text-6xl">
            Create work the network can verify.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-foreground/58">
            Fund an outcome, contribute evidence, or build an onchain reputation
            through work that speaks for itself.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/create"
              className="landing-primary-button rounded-2xl px-7 py-4 text-base font-semibold"
            >
              Create a task <ArrowIcon />
            </Link>
            <Link
              to="/app"
              className="heroSecondary rounded-2xl px-7 py-4 text-base font-semibold"
            >
              Browse tasks
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-7 pt-3 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-sm text-foreground/35 sm:flex-row">
          <p>Proof of Impact — Verifiable work on GenLayer</p>
          <div className="flex items-center gap-6">
            <Link className="transition-colors hover:text-foreground" to="/app">
              Tasks
            </Link>
            <Link className="transition-colors hover:text-foreground" to="/leaderboard">
              Leaderboard
            </Link>
            <a
              className="transition-colors hover:text-foreground"
              href="https://www.genlayer.com/"
              target="_blank"
              rel="noreferrer"
            >
              GenLayer
            </a>
          </div>
        </div>
      </footer>

      <section className="landing-ecosystem" aria-label="GenLayer ecosystem">
        <div className="landing-ecosystem-inner">
          <a
            href="https://www.genlayer.com/"
            target="_blank"
            rel="noreferrer"
            className="landing-ecosystem-label"
          >
            Ecosystem &amp; infrastructure
            <br />
            supporting GenLayer
          </a>

          <div className="landing-ecosystem-marquee">
            <div className="landing-marquee-fade landing-marquee-fade-left" />
            <div className="landing-marquee-fade landing-marquee-fade-right" />
            <div className="animate-marquee-track">
              {[0, 1].map((group) => (
                <div
                  className="flex shrink-0 gap-12 pr-12"
                  aria-hidden={group === 1 ? 'true' : undefined}
                  key={group}
                >
                  {ecosystemLogos.map((logo) => (
                    <a
                      className="landing-ecosystem-logo"
                      href={logo.url}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={group === 1 ? -1 : undefined}
                      key={`${group}-${logo.name}`}
                    >
                      <span className="landing-ecosystem-mark">{logo.letter}</span>
                      <span>{logo.name}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
