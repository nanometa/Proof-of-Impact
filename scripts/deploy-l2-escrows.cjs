const fs = require('node:fs')
const path = require('node:path')
const { ethers } = require('ethers')

const networks = [
  {
    key: 'sepolia',
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  {
    key: 'baseSepolia',
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  },
  {
    key: 'opSepolia',
    chainId: 11155420,
    name: 'OP Sepolia',
    rpcUrl: process.env.OP_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
  },
  {
    key: 'arbitrumSepolia',
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  },
]

async function loadWallet() {
  if (process.env.PRIVATE_KEY) {
    return new ethers.Wallet(process.env.PRIVATE_KEY)
  }

  if (!process.env.KEYSTORE_PATH || !process.env.KEYSTORE_PASSWORD) {
    throw new Error('Set PRIVATE_KEY or KEYSTORE_PATH + KEYSTORE_PASSWORD.')
  }

  const keystore = fs.readFileSync(process.env.KEYSTORE_PATH, 'utf8')
  return await ethers.Wallet.fromEncryptedJson(keystore, process.env.KEYSTORE_PASSWORD)
}

function loadArtifact() {
  const artifactPath = path.join(
    process.cwd(),
    'artifacts',
    'evm',
    'contracts',
    'evm',
    'L2TaskEscrow.sol',
    'L2TaskEscrow.json',
  )
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Missing L2TaskEscrow artifact. Run npm run compile:evm first.')
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
}

async function main() {
  const baseWallet = await loadWallet()
  const artifact = loadArtifact()
  const settler = process.env.SETTLER_ADDRESS || baseWallet.address
  const selected = process.env.L2_NETWORK
    ? networks.filter((network) => network.key === process.env.L2_NETWORK)
    : networks

  if (selected.length === 0) {
    throw new Error(`Unknown L2_NETWORK: ${process.env.L2_NETWORK}`)
  }

  const results = {}

  for (const network of selected) {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl, network.chainId)
    const wallet = baseWallet.connect(provider)
    const balance = await provider.getBalance(wallet.address)
    console.log(`\n${network.name} (${network.chainId})`)
    console.log(`deployer=${wallet.address}`)
    console.log(`balance=${ethers.formatEther(balance)} ETH`)

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet)
    const contract = await factory.deploy(settler)
    const receipt = await contract.deploymentTransaction().wait()
    const address = await contract.getAddress()

    results[network.chainId] = {
      network: network.name,
      chainId: network.chainId,
      address,
      tx: receipt.hash,
      settler,
    }

    console.log(`escrow=${address}`)
    console.log(`tx=${receipt.hash}`)
  }

  const outputDir = path.join(process.cwd(), 'deployments')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, 'l2-escrows.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`)
  console.log(`\nSaved ${outputPath}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
