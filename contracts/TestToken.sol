
//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Testtoken1 is ERC20 {
    constructor(uint256 initialSupply) ERC20("Test", "TEST") {
        _mint(msg.sender, (initialSupply * (10 ** uint256(decimals()))));
    }
}

contract Testtoken2 is ERC20 {
    constructor(uint256 initialSupply) ERC20("Test", "TEST2") {
        _mint(msg.sender, (initialSupply * (10 ** uint256(decimals()))));
    }
}