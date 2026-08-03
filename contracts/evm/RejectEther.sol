// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RejectEther {
    receive() external payable {
        revert("reject ether");
    }
}
