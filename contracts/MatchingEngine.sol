//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

//Importing contracts
import "./Exchange.sol";

//Import RBTree library and other SafeMath
import "./lib/BokkyPooBahsRedBlackTreeLibrary.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
@title Matching Engine Contract
*/
contract MatchingEngine is Exchange {

    bool public EngineTrading = false;

    //Importing Libraries
    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;
    using SafeMath for uint256;

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
    function makeOffer(uint _sell_amt, address _sell_token, uint _buy_amt, address _buy_token, uint256 _expires) public override returns (uint256 _id) {
    
        //Calling base function - Creating the order
        _id = super.makeOffer(_sell_amt,_sell_token,_buy_amt,_buy_token,_expires);
        uint _price;
        uint _highest_taker_buy_price;
        BokkyPooBahsRedBlackTreeLibrary.Tree storage _tree;

        //Only use overwritten function if matching engine is turned on
        if(EngineTrading){

            //Check that there are actually orders in the book - if not in the book just add to the book
            //Making sure you swap sell and buy as to get both parts of the order book -> What someone is looking to sell
            //and what you are looking to buy
            //Try to automatically take orders
            if(orderBook[_buy_token][_sell_token].root != 0){
                
                //There are orders that need to be sifted through
                //Get the first order to look at it

                //Work out how much the caller (now the taker is willing to pay)
                _highest_taker_buy_price = _sell_amt.div(_buy_amt);

                //Get the first lowest order and see if you can take it - The last order in the tree highest price
                _tree = orderBook[_buy_token][_sell_token];
                
            }
            else{
                //If there are currently no orders to be taken just add the order into the orderbook
                _price = _sell_amt.div(_buy_amt);
                //_price = _buy_amt.div(_sell_amt); //Lowest price a maker is willing to sell at 

                insert(_price, _id, _sell_token, _buy_token);
            }

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