//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

//Importing contracts
import "./Exchange.sol";

//Import RBTree library
import "./lib/BokkyPooBahsRedBlackTreeLibrary.sol";

/**
@title Matching Engine Contract
*/
contract MatchingEngine is Exchange {

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
    function getNode(uint _id, address _sell_token, address _buy_token) public view returns (uint price) {
        if (orderBook[_sell_token][_buy_token].exists(_id)) {
            (,,,,price,) = orderBook[_sell_token][_buy_token].getNode(_id);
            return price;
        }
    }

    /*function autoMatchOffer(uint _id, address _sell_token, address _buy_token) public returns (bool){

        //What type of order is it 

        //

    }*/


    //Overwritten Functions

    /**
    //Make offer for trade - Override
    @param _sell_amt The amount of the token you want to sell
    @param _sell_token The address of the token you want to sell
    @param _buy_amt The amount of tokens you want to buy for
    @param _buy_token The address of the tokens you wan to buy
    @param _expires when the order expires
     */
    function makeOffer(uint _sell_amt, address _sell_token, uint _buy_amt, address _buy_token, uint256 _expires) public override returns (uint256) {
    
        //Only use overwritten function if matching engine is turned on
        if(!EngineTrading){
            //Calling base function
            super.makeOffer(_sell_amt,_sell_token,_buy_amt,_buy_token,_expires);
        }
        else{

            //Check that there are actually orders in the book - if not in the book just add to the book



            //


        }


    }

    /**
    //Takes a current offer - Override
    @param _order_id The id of the order you want to fill
    @param _quantity The amount of the order you want to fill
     */
    function takeOffer(uint _order_id, uint _quantity) public override preventRecursion {

        //Only use overwritten function if matching engine is turned on
        if(!EngineTrading){
            //Calling base function
            super.takeOffer(_order_id,_quantity);
        }
        else{
            
        }

    }

    /**
    //Cancels the current order - Override
    @param _order_id the id of the order to cancel - can only cancel if you are owner of the order
     */
    function cancelOffer(uint _order_id) public override orderActive(_order_id) {
    
        //Only use overwritten function if matching engine is turned on
        if(!EngineTrading){
            //Calling base function
            super.cancelOffer(_order_id);
        }
        else{
            
        }

    }
}