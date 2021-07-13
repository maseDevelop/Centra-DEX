//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;


//Importing contract
import "./Exchange.sol";

//Import RBTree library
import "./BokkyPooBahsRedBlackTreeLibrary.sol";


/**
@title Matching Engine Contract
*/
contract MatchingEngine is Exchange {

    bool private EngineTrading = false;

    //Sell -> Buy -> Orders for the token combo
    mapping (address => mapping(address => uint256)) orderBook;

}