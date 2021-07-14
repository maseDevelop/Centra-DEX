//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

//Import RBTree library
import "./BokkyPooBahsRedBlackTreeLibrary.sol";

/**
@title Matching Engine Contract
*/
contract MatchingEngine {

    bool public EngineTrading = false;

    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;

    //Sell -> Buy -> Tree that holds the orders
    mapping (address => mapping(address => BokkyPooBahsRedBlackTreeLibrary.Tree)) orderBook;

    /**
    Inserts an order into the order book
    @param _price the price for the token swap
    @param _id the id of the order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
     */
    function insert(uint _price, uint _id, address _sell_token, address _buy_token) public {
        //Order book mapping to insert into 
        orderBook[_sell_token][_buy_token].insert(_price, _id);
    }

   /**
    Removes an order from the order book tree
    @param _id the id of the order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
     */
    function remove(uint _id, address _sell_token, address _buy_token) public {
        //Order book mapping to remove from
        orderBook[_sell_token][_buy_token].remove(_id);
    }

    /**
    Gets the best offer id for the specific order book
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return _id the id of teh lowest offer
    */
    function getFirstOffer(address _sell_token, address _buy_token) public view returns(uint) {
        return orderBook[_sell_token][_buy_token].first();
    }


    /**
    Gets the dearest offer id for the specific order book
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return _id the id of teh lowest offer
    */
    function getLastOffer(address _sell_token, address _buy_token) public view returns(uint) {
        return orderBook[_sell_token][_buy_token].last();
    }


    /**
    Changes the price of a node in the tree
    @param _price the new price for the token swap
    @param _id the id of the order you want to change
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    */
    function changeOrderPrice(uint _price, uint _id, address _sell_token, address _buy_token) public {
        
        //Remove current order
        orderBook[_sell_token][_buy_token].remove(_id);
        //Add a new order with the same price
        //Order book mapping to insert into 
        orderBook[_sell_token][_buy_token].insert(_price, _id);
    }

    /**
    Get an orders price
    @param _id the id of an order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return price the price for that order
    */
    function getNode(uint _id,address _sell_token, address _buy_token) public view returns (uint price) {
        if (orderBook[_sell_token][_buy_token].exists(_id)) {
            (,,,,price,) = orderBook[_sell_token][_buy_token].getNode(_id);
            return price;
        }
    }


    //Write going throgh the orders
}