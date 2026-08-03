export const TASK_TEMPLATES = [
  {
    key: 'code',
    label: 'Code delivery',
    shortLabel: 'Code',
    evidence:
      'Repository URL, commits or release notes, tests, documentation, and a short delivery summary.',
    focus:
      'Correctness, runnable implementation, tests, maintainability, and alignment with the brief.',
    criteria:
      'Repository is public and relevant; implementation runs or is clearly reviewable; tests or validation evidence are included; README explains setup and delivery scope.',
  },
  {
    key: 'research',
    label: 'Research',
    shortLabel: 'Research',
    evidence:
      'Public report, cited sources, methodology, dataset or notes, and reproducible conclusions.',
    focus:
      'Source quality, methodology, factual support, clarity, and relevance to the requested question.',
    criteria:
      'Report includes credible sources, transparent methodology, clear findings, limitations, and conclusions tied to the requested research question.',
  },
  {
    key: 'design',
    label: 'Design',
    shortLabel: 'Design',
    evidence:
      'Design file or screenshots, brief mapping, exported assets, and implementation notes.',
    focus:
      'Brief fit, visual consistency, usability, completeness, and asset handoff quality.',
    criteria:
      'Design matches the brief, includes source or export files, covers key states, remains usable, and explains major design decisions.',
  },
  {
    key: 'community',
    label: 'Community',
    shortLabel: 'Community',
    evidence:
      'Campaign links, metrics, screenshots or dashboards, audience proof, and anti-spam context.',
    focus:
      'Authentic reach, engagement quality, anti-spam signals, deliverable match, and measurable impact.',
    criteria:
      'Campaign evidence is public, metrics are plausible, engagement looks authentic, and the work matches the requested community outcome.',
  },
  {
    key: 'content',
    label: 'Content',
    shortLabel: 'Content',
    evidence:
      'Published URL, draft or source material, target audience, distribution proof, and ownership note.',
    focus:
      'Accuracy, originality, audience fit, clarity, publication quality, and alignment with the brief.',
    criteria:
      'Content is published or reviewable, accurate, original, aligned with the target audience, and supported by distribution or ownership evidence.',
  },
  {
    key: 'data',
    label: 'Data',
    shortLabel: 'Data',
    evidence:
      'Dataset, schema, cleaning notes, validation script or checks, and source provenance.',
    focus:
      'Data quality, reproducibility, provenance, schema clarity, validation coverage, and usefulness.',
    criteria:
      'Dataset has clear provenance, schema, cleaning notes, validation checks, and is useful for the task objective without privacy leakage.',
  },
]

export const PAYOUT_NETWORKS = [
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    nativeToken: 'ETH',
    badge: 'Sepolia ETH',
    shortName: 'sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    nativeToken: 'ETH',
    badge: 'Base Sepolia ETH',
    shortName: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  {
    chainId: 11155420,
    name: 'OP Sepolia',
    nativeToken: 'ETH',
    badge: 'OP Sepolia ETH',
    shortName: 'op-sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    nativeToken: 'ETH',
    badge: 'Arbitrum Sepolia ETH',
    shortName: 'arbitrum-sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
]

export function getTaskTemplate(key) {
  return TASK_TEMPLATES.find((item) => item.key === key) || TASK_TEMPLATES[0]
}

export function getPayoutNetwork(chainId) {
  return PAYOUT_NETWORKS.find((item) => item.chainId === Number(chainId)) || PAYOUT_NETWORKS[0]
}
