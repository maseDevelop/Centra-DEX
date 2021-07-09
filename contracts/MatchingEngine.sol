//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

/**
@title Matching Engine Contract
*/
contract MatchingEngine {

    bool private EngineTrading = false;

    mapping (address => mapping(address => uint256)) orderBook;

}