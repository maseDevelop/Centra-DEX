//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22 <0.9.0;

//Import RBTree library and other libraries
import "./BokkyPooBahsRedBlackTreeLibrary.sol";

/**
@title library that keeps a sorted order book
 */
library OrderBookLib {

    //Importing Libraries
    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;

    struct OB {
        //Sell -> Buy -> Tree that holds the orders
        mapping (address => mapping(address => BokkyPooBahsRedBlackTreeLibrary.Tree)) orderBook;
    }

    /**
    Inserts an order into the order book
    @param _price the price for the token swap
    @param _id the id of the order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
     */
    function insert(OB storage self,uint _price, uint _id, address _sell_token, address _buy_token) public {
        //Order book mapping to insert into 
        self.orderBook[_sell_token][_buy_token].insert(_price, _id);
    }

   /**
    Removes an order from the order book tree
    @param _id the id of the order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
     */
    function remove(OB storage self,uint _id, address _sell_token, address _buy_token) public {
        //Order book mapping to remove from
        self.orderBook[_sell_token][_buy_token].remove(_id);
    }

    /**
    Gets the best offer id for the specific order book
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return _id the id of teh lowest offer
    */
    function getFirstOffer(OB storage self, address _sell_token, address _buy_token) public view returns(uint) {
        return self.orderBook[_sell_token][_buy_token].first();
    }


    /**
    Gets the dearest offer id for the specific order book
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return _id the id of teh lowest offer
    */
    function getLastOffer(OB storage self, address _sell_token, address _buy_token) public view returns(uint) {
        return self.orderBook[_sell_token][_buy_token].last();
    }

    /**
    Get an orders price
    @param _id the id of an order
    @param _sell_token the address of the sell token
    @param _buy_token the address of the buy token
    @return price the price for that order
    */
    function getNode(OB storage self, uint _id, address _sell_token, address _buy_token) public view returns (uint price) {
        if (self.orderBook[_sell_token][_buy_token].exists(_id)) {
            (,,,,price,) = self.orderBook[_sell_token][_buy_token].getNode(_id);
            return price;
        }
    }

}

