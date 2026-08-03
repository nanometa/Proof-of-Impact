require('@nomicfoundation/hardhat-ethers')

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts/evm',
    tests: './tests/evm',
    cache: './artifacts/evm-cache',
    artifacts: './artifacts/evm',
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      accounts,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts,
    },
    opSepolia: {
      url: process.env.OP_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
      accounts,
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts,
    },
  },
}
