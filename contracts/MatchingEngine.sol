//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

//Importing contracts
import "./Exchange.sol";

import "./lib/BokkyPooBahsRedBlackTreeLibrary.sol";

import "./lib/OrderBookLib.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "prb-math/contracts/PRBMathUD60x18.sol";

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
@title Matching Engine Contract - On-chain Part of the system
@author Mason Elliott
@notice Experimental Contract - matching engine matches orders for the on-chain part of the system
*/
contract MatchingEngine is Exchange {
    bool public EngineTrading = false;

    event EngineTradingStatus(bool status);

    //Importing Libraries
    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;
    using OrderBookLib for OrderBookLib.OB;
    using SafeMath for uint256;
    using SafeCast for uint256;
    using PRBMathUD60x18 for uint256;

    OrderBookLib.OB ob;

    /**
    @notice Turns on the on-chain matching engine
    */
    function setEngineTrading(bool _value) public {
        EngineTrading = _value;
        emit EngineTradingStatus(_value);
    }

    /**
    @notice Gets the first order stored in the order book for a buy and sell token
    @param _sell_token address of the sell token
    @param _buy_token address of the buy token
    */
    function getFirstOffer(address _sell_token, address _buy_token)
        public
        view
        returns (uint256)
    {
        return ob.orderBook[_sell_token][_buy_token].first();
    }

    /**
    @notice Overwritten function from make offer - Matches orders as they come in
    */
    function makeOffer(
        uint256 _sell_amt,
        address _sell_token,
        uint256 _buy_amt,
        address _buy_token,
        uint256 _expires
    ) public override returns (uint256 _id) {
        //Calling base function - Creating the order
        _id = super.makeOffer(
            _sell_amt,
            _sell_token,
            _buy_amt,
            _buy_token,
            _expires
        );

        //Add to the order book - This removes any chance for deleting when not in tree error
        uint256 _price = PRBMathUD60x18.div(_sell_amt, _buy_amt);

        ob.orderBook[_sell_token][_buy_token].insert(_price, _id);

        //Only use overwritten function if matching engine is turned on
        if (EngineTrading) {
            //Try to automatically take orders
            if (ob.orderBook[_buy_token][_sell_token].root != 0) {
                //Lowest price taker is willing to sell for
                uint256 _lowest_price_t_sell_price = PRBMathUD60x18.div(
                    _buy_amt,
                    _sell_amt
                );

                //Get the Lowest order in the tree
                uint256 _current_id = ob
                .orderBook[_buy_token][_sell_token].first();

                //Search to find an order that meets the conditions of the taker
                while (_current_id != 0) {
                    if (
                        ob
                        .orderBook[_buy_token][_sell_token]
                            .nodes[_current_id]
                            .price < _lowest_price_t_sell_price
                    ) {
                        //Get the next biggest value
                        _current_id = ob
                        .orderBook[_buy_token][_sell_token].next(_current_id);
                    } else {
                        break;
                    }
                }

                int256 _order_fill_amount;
                while (currentOffers[_id].sell_amt != 0) {
                    //Now fill the orders
                    _order_fill_amount =
                        currentOffers[_id].sell_amt.toInt256() -
                        currentOffers[_current_id].buy_amt.toInt256();

                    if (_order_fill_amount > 0) {
                        //Partially filled
                        _trade(
                            _current_id,
                            _id,
                            currentOffers[_current_id].buy_amt
                        ); //Maybe sell_amt;

                        _current_id = ob
                        .orderBook[_buy_token][_sell_token].first();
                    } else {
                        //Fully filled
                        _trade(_id, _current_id, currentOffers[_id].sell_amt);
                    }
                }
            }
        }
    }

    /**
    @notice Overrided Take Offer function
    */
    function takeOffer(uint256 _order_id, uint256 _quantity)
        public
        override
        preventRecursion
    {
        //Calling base function
        super.takeOffer(_order_id, _quantity);
        //Only use overwritten function if matching engine is turned on
        if (EngineTrading) {
            //Removing from the order book
            ob
            .orderBook[currentOffers[_order_id].sell_token][
                currentOffers[_order_id].buy_token
            ].remove(_order_id);

            //calculating new price
            uint256 _price = PRBMathUD60x18.div(
                currentOffers[_order_id].sell_amt,
                currentOffers[_order_id].buy_amt
            );

            //Inserting the order back into the tree - after the order should be updated
            ob
            .orderBook[currentOffers[_order_id].sell_token][
                currentOffers[_order_id].buy_token
            ].insert(_price, _order_id);
        }
    }

    /**
    @notice Overwritten cancel offer function
    */
    function cancelOffer(uint256 _order_id)
        public
        override
        orderActive(_order_id)
    {
        //Only use overwritten function if matching engine is turned on
        if (!EngineTrading) {
            //Calling base function
            super.cancelOffer(_order_id);
        } else {
            //Removing from the order book
            ob
            .orderBook[currentOffers[_order_id].sell_token][
                currentOffers[_order_id].buy_token
            ].remove(_order_id);

            //Removing orders from offer mapping
            super.cancelOffer(_order_id);
        }
    }

    /**
    @notice trades tokens between users
    @param _offer1 ID of offer 1 - The first offer is always being fully filled
    @param _offer2 ID of offer 2 - The second offer is not filled full
    */
    function _trade(
        uint256 _offer1,
        uint256 _offer2,
        uint256 _quantity
    ) internal {
        //make sure that you are not taking more than the they are selling
        //price infered on exchange esimated price as not just a order price for fiat
        uint256 tradeAmountMul = PRBMathUD60x18.mul(
            _quantity,
            currentOffers[_offer2].buy_amt
        );
        uint256 tradeAmount = PRBMathUD60x18.div(
            tradeAmountMul,
            currentOffers[_offer2].sell_amt
        );

        //Make sure trade amount is valid
        require(tradeAmount >= 0, "Trade amount is not valid");

        //Renstate the owners ablity to trade funds that they put up for sale - by how much the owner is willig to pay
        usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].sell_token
        ] = usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].sell_token
        ].add(_quantity);

        //Move the funds sell token from each user
        usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].sell_token
        ] = usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].sell_token
        ].sub(_quantity);
        usertokens[msg.sender][currentOffers[_offer2].buy_token] = usertokens[
            msg.sender
        ][currentOffers[_offer2].buy_token].sub(tradeAmount);

        //Add the token trades back
        usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].buy_token
        ] = usertokens[currentOffers[_offer2].owner][
            currentOffers[_offer2].buy_token
        ].add(tradeAmount);
        usertokens[msg.sender][currentOffers[_offer2].sell_token] = usertokens[
            msg.sender
        ][currentOffers[_offer2].sell_token].add(_quantity);

        //Updating order information - always clear offer1
        currentOffers[_offer1].buy_amt = 0;
        currentOffers[_offer1].sell_amt = 0;
        ob
        .orderBook[currentOffers[_offer1].sell_token][
            currentOffers[_offer1].buy_token
        ].remove(_offer1); //Not going to work when not in tree
        emit FilledOffer(
            currentOffers[_offer1].sell_amt,
            currentOffers[_offer1].sell_token,
            currentOffers[_offer1].buy_amt,
            currentOffers[_offer1].buy_token,
            currentOffers[_offer1].owner,
            currentOffers[_offer1].expires,
            block.timestamp
        );
        delete currentOffers[_offer1];

        currentOffers[_offer2].buy_amt = currentOffers[_offer2].buy_amt.sub(
            tradeAmount
        );
        currentOffers[_offer2].sell_amt = currentOffers[_offer2].sell_amt.sub(
            _quantity
        );

        //Has the order been finished - reset the order
        if (currentOffers[_offer2].sell_amt == 0) {
            emit FilledOffer(
                currentOffers[_offer2].sell_amt,
                currentOffers[_offer2].sell_token,
                currentOffers[_offer2].buy_amt,
                currentOffers[_offer2].buy_token,
                currentOffers[_offer2].owner,
                currentOffers[_offer2].expires,
                block.timestamp
            );
            //Reset order
            ob
            .orderBook[currentOffers[_offer2].sell_token][
                currentOffers[_offer2].buy_token
            ].remove(_offer2);
            delete currentOffers[_offer2];
        } else {
            emit PartialFillOffer(
                currentOffers[_offer2].sell_amt,
                currentOffers[_offer2].sell_token,
                currentOffers[_offer2].buy_amt,
                currentOffers[_offer2].buy_token,
                currentOffers[_offer2].owner,
                currentOffers[_offer2].expires,
                block.timestamp
            );
        }
    }
}
