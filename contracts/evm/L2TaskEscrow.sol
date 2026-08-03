// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title L2TaskEscrow
/// @notice Native ETH escrow used by Proof of Impact tasks on EVM testnets.
/// GenLayer remains the consensus layer. This contract only holds ETH and
/// executes atomic payout/refund once the GenLayer verdict is known.
contract L2TaskEscrow {
    enum Status {
        None,
        Funded,
        Released,
        Refunded
    }

    struct Escrow {
        address creator;
        uint256 amount;
        uint64 refundAfter;
        uint256 createdAt;
        Status status;
        address winner;
        bytes32 genlayerSettlementRef;
    }

    address public owner;
    mapping(address => bool) public authorizedSettlers;
    mapping(bytes32 => Escrow) private escrows;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SettlerUpdated(address indexed settler, bool allowed);
    event EscrowCreated(bytes32 indexed escrowId, address indexed creator, uint256 amount, uint64 refundAfter);
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed winner,
        uint256 amount,
        bytes32 indexed genlayerSettlementRef
    );
    event EscrowRefunded(bytes32 indexed escrowId, address indexed creator, uint256 amount);

    error OnlyOwner();
    error OnlySettler();
    error EscrowExists();
    error EscrowNotFunded();
    error InvalidEscrowId();
    error InvalidAmount();
    error InvalidRecipient();
    error InvalidRefundDeadline();
    error InvalidSettlementRef();
    error ScoreBelowThreshold();
    error RefundNotAvailable();
    error TransferFailed();

    constructor(address initialSettler) {
        owner = msg.sender;
        authorizedSettlers[msg.sender] = true;
        if (initialSettler != address(0)) {
            authorizedSettlers[initialSettler] = true;
            emit SettlerUpdated(initialSettler, true);
        }
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlySettler() {
        if (!authorizedSettlers[msg.sender]) revert OnlySettler();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidRecipient();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAuthorizedSettler(address settler, bool allowed) external onlyOwner {
        if (settler == address(0)) revert InvalidRecipient();
        authorizedSettlers[settler] = allowed;
        emit SettlerUpdated(settler, allowed);
    }

    function createEscrow(bytes32 escrowId, uint64 refundAfter) external payable {
        if (escrowId == bytes32(0)) revert InvalidEscrowId();
        if (msg.value == 0) revert InvalidAmount();
        if (refundAfter <= block.timestamp) revert InvalidRefundDeadline();
        if (escrows[escrowId].status != Status.None) revert EscrowExists();

        escrows[escrowId] = Escrow({
            creator: msg.sender,
            amount: msg.value,
            refundAfter: refundAfter,
            createdAt: block.timestamp,
            status: Status.Funded,
            winner: address(0),
            genlayerSettlementRef: bytes32(0)
        });

        emit EscrowCreated(escrowId, msg.sender, msg.value, refundAfter);
    }

    /// @notice Releases ETH to the GenLayer-selected winner. If the transfer
    /// fails, the whole call reverts and the escrow remains funded/retryable.
    function release(
        bytes32 escrowId,
        address payable winner,
        bytes32 genlayerSettlementRef,
        uint16 score,
        uint16 threshold
    ) external onlySettler {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != Status.Funded) revert EscrowNotFunded();
        if (winner == address(0)) revert InvalidRecipient();
        if (genlayerSettlementRef == bytes32(0)) revert InvalidSettlementRef();
        if (score < threshold) revert ScoreBelowThreshold();

        uint256 amount = escrow.amount;
        escrow.status = Status.Released;
        escrow.amount = 0;
        escrow.winner = winner;
        escrow.genlayerSettlementRef = genlayerSettlementRef;

        (bool ok,) = winner.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EscrowReleased(escrowId, winner, amount, genlayerSettlementRef);
    }

    /// @notice Refunds the creator after the L2 escrow deadline. If transfer
    /// fails, the escrow remains funded/retryable.
    function refund(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.status != Status.Funded) revert EscrowNotFunded();
        if (msg.sender != escrow.creator) revert OnlyOwner();
        if (block.timestamp < escrow.refundAfter) revert RefundNotAvailable();

        uint256 amount = escrow.amount;
        address payable creator = payable(escrow.creator);
        escrow.status = Status.Refunded;
        escrow.amount = 0;

        (bool ok,) = creator.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit EscrowRefunded(escrowId, creator, amount);
    }

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
}
