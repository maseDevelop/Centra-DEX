
//SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.4.22 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Test", "TEST") {
        _mint(msg.sender, initialSupply);
    }
}