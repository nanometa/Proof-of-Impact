const assert = require('node:assert/strict')
const { ethers } = require('hardhat')

const escrowId = ethers.id('proof-of-impact:task-0')
const settlementRef = ethers.id('genlayer:task-0:sub-0:score-82')

describe('L2TaskEscrow', function () {
  async function deployFixture() {
    const [owner, creator, worker, outsider] = await ethers.getSigners()
    const Escrow = await ethers.getContractFactory('L2TaskEscrow')
    const escrow = await Escrow.deploy(owner.address)
    await escrow.waitForDeployment()
    return { escrow, owner, creator, worker, outsider }
  }

  async function latestTimestamp() {
    const block = await ethers.provider.getBlock('latest')
    return block.timestamp
  }

  it('locks native ETH for a task escrow', async function () {
    const { escrow, creator } = await deployFixture()
    const refundAfter = (await latestTimestamp()) + 3600
    const amount = ethers.parseEther('0.05')

    await escrow.connect(creator).createEscrow(escrowId, refundAfter, { value: amount })

    const stored = await escrow.getEscrow(escrowId)
    assert.equal(stored.creator, creator.address)
    assert.equal(stored.amount, amount)
    assert.equal(stored.status, 1n)
    assert.equal(await ethers.provider.getBalance(await escrow.getAddress()), amount)
  })

  it('rejects empty deposits and duplicate escrow ids', async function () {
    const { escrow, creator } = await deployFixture()
    const refundAfter = (await latestTimestamp()) + 3600

    await assert.rejects(
      escrow.connect(creator).createEscrow(escrowId, refundAfter),
      /InvalidAmount/,
    )

    await escrow.connect(creator).createEscrow(escrowId, refundAfter, {
      value: ethers.parseEther('0.01'),
    })

    await assert.rejects(
      escrow.connect(creator).createEscrow(escrowId, refundAfter, {
        value: ethers.parseEther('0.01'),
      }),
      /EscrowExists/,
    )
  })

  it('only an authorized settler can release payout after a qualifying score', async function () {
    const { escrow, creator, worker, outsider } = await deployFixture()
    const refundAfter = (await latestTimestamp()) + 3600
    const amount = ethers.parseEther('0.02')

    await escrow.connect(creator).createEscrow(escrowId, refundAfter, { value: amount })

    await assert.rejects(
      escrow.connect(outsider).release(escrowId, worker.address, settlementRef, 85, 70),
      /OnlySettler/,
    )

    await assert.rejects(
      escrow.release(escrowId, worker.address, settlementRef, 69, 70),
      /ScoreBelowThreshold/,
    )

    await escrow.release(escrowId, worker.address, settlementRef, 85, 70)

    const stored = await escrow.getEscrow(escrowId)
    assert.equal(stored.status, 2n)
    assert.equal(stored.amount, 0n)
    assert.equal(stored.winner, worker.address)
    assert.equal(stored.genlayerSettlementRef, settlementRef)
  })

  it('keeps failed payout transfers retryable', async function () {
    const { escrow, creator, worker } = await deployFixture()
    const RejectEther = await ethers.getContractFactory('RejectEther')
    const rejectEther = await RejectEther.deploy()
    await rejectEther.waitForDeployment()

    const refundAfter = (await latestTimestamp()) + 3600
    const amount = ethers.parseEther('0.03')
    await escrow.connect(creator).createEscrow(escrowId, refundAfter, { value: amount })

    await assert.rejects(
      escrow.release(escrowId, await rejectEther.getAddress(), settlementRef, 90, 70),
      /TransferFailed/,
    )

    let stored = await escrow.getEscrow(escrowId)
    assert.equal(stored.status, 1n)
    assert.equal(stored.amount, amount)

    await escrow.release(escrowId, worker.address, settlementRef, 90, 70)
    stored = await escrow.getEscrow(escrowId)
    assert.equal(stored.status, 2n)
    assert.equal(stored.amount, 0n)
  })

  it('refunds creator after the deadline and prevents double settlement', async function () {
    const { escrow, creator, worker } = await deployFixture()
    const refundAfter = (await latestTimestamp()) + 120
    const amount = ethers.parseEther('0.01')
    await escrow.connect(creator).createEscrow(escrowId, refundAfter, { value: amount })

    await assert.rejects(escrow.connect(creator).refund(escrowId), /RefundNotAvailable/)

    await ethers.provider.send('evm_setNextBlockTimestamp', [refundAfter + 1])
    await ethers.provider.send('evm_mine')

    await escrow.connect(creator).refund(escrowId)
    const stored = await escrow.getEscrow(escrowId)
    assert.equal(stored.status, 3n)
    assert.equal(stored.amount, 0n)

    await assert.rejects(
      escrow.release(escrowId, worker.address, settlementRef, 90, 70),
      /EscrowNotFunded/,
    )
  })
})
