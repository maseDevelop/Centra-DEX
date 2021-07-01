//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

/**
@title Exchange Contract
*/
contract Exchange {

    //Importing Libraries
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    //Seen Nonces - to prevent replay attacks
    //mapping(address => mapping(uint256 => bool)) private seenNonces;

    //Storage
    mapping(address => mapping(address => uint256)) private userTokens; //Maps token balances for an account

    //Order Mappings
    mapping(uint256 => OfferInfo) public currentOffers;

    //State Variables
    Counters.Counter private currentOrderId;

    //Offer Struct
    struct OfferInfo {
        uint256    id;        // <-- order id  
        uint     sell_amt;   // <-- amount to pay/sell (wei)
        address  sell_gem;   // <-- address of token
        uint     buy_amt;   // <-- amount to buy (wei)
        address  buy_gem;   // <-- address of token
        address  owner;    // <-- who created the offer
        uint256  expires;    // <-- when the offer expires
        uint256  timestamp; // <-- when offer was created
        bool     orderFilled; // <-- false as default true when order is canceled or filled
    }

    //Events
    event MakeOffer(uint _sell_amt, address _sell_gem, uint _buy_amt, address _buy_gem, address _owner, uint256 _expires, uint256 timeStamp);
    event PartialFillOffer(uint _sell_amt, address _sell_gem, uint _buy_amt, address _buy_gem, address _owner, uint256 _expires, uint256 timeStamp);
    event FilledOffer(uint _sell_amt, address _sell_gem, uint _buy_amt, address _buy_gem, address _owner, uint256 _expires, uint256 timeStamp);
    event Deposit(address token,address user, uint256 amount, uint256 balance);
    event Withdraw(address token,address user,uint256 amount,uint256 balance);

    //Modifiers
    bool private mutex = false;//global mutex variable
    
    /**
    @dev Stops recusive function calls - prevents re-entrancy attack
    */
    modifier preventRecursion {
        if(mutex == false) {
        mutex = true;
        _;
        mutex = false;
        }
    }

    /**
    @dev Checks if the order is active
    */
    modifier orderActive(uint256 _id){
        require(currentOffers[_id].sell_amt > 0, "Order is not active");
        _;
    }

    /**
    Deposit ERC20 Token into the contract
    @param _tokenAddress The address of the token you want to deposit into the contract
    @param _tokenAmount The amount of the token you want to deposit into the escrow 
    @notice Please use this function to deposit tokens into the contract,
    as they will therefore be tracked by the contract
    */
    function depositToken(address _tokenAddress, uint256 _tokenAmount) public  {

        require(address(_tokenAddress) != address(0x0),"This is Ether, Please deposit a ERC20 compliant token");

        require(_tokenAmount != 0,"Token amoount is set to zero, please specifier amount greater than 0");

        //Creating an interface for the token
        IERC20 _token = IERC20(_tokenAddress);

        //Call for the token by the user
        _token.safeTransferFrom(msg.sender, address(this), _tokenAmount);

        //Save that the user has deposited the token into the contract
        userTokens[msg.sender][_tokenAddress] = userTokens[msg.sender][_tokenAddress].add(_tokenAmount); //NEED TO CHECK THIS

        //emit an event
        emit Deposit(_tokenAddress,msg.sender,_tokenAmount,userTokens[msg.sender][_tokenAddress]);
    }

    /**
    Withdraw certain ERC-20 token
    @param _tokenAddress The address of the token you want to withdraw from the contract
    @param _tokenAmount The amount of the token you want to withdraw from the contract
    */
    function withdrawToken(address _tokenAddress, uint256 _tokenAmount) public preventRecursion {

        //Check they actually have a balance for the token
        require(userTokens[msg.sender][_tokenAddress] >= _tokenAmount,"You do not have enough tokens to withdraw");

        //Creating an interface for the token
        IERC20 _token = IERC20(_tokenAddress);

        //Save that the user has withdrawn the token into the contract
        userTokens[msg.sender][_tokenAddress] = userTokens[msg.sender][_tokenAddress].sub(_tokenAmount); //NEED TO CHECK THIS

        //Transfering token to users account
        _token.safeTransfer(msg.sender, _tokenAmount);

        //emit an event
        emit Withdraw(_tokenAddress,msg.sender,_tokenAmount,userTokens[msg.sender][_tokenAddress]);
    }

    /**
    Gets the users balance for a particular token
    @param _tokenAddress The token you want the balance for
    */
    function getBalance(address _tokenAddress) external view returns (uint256) {
        return userTokens[msg.sender][_tokenAddress];
    }

    //Maker
    function makeOffer(uint _sell_amt, address _sell_gem, uint _buy_amt, address _buy_gem, uint256 _expires) public returns (uint) {

        //Perform Checks 
        
        //check reentrancy 
        
        //Make sure that they have enough funds for transfer
        require(userTokens[msg.sender][_sell_gem] >= _sell_amt, "You don't have enought funds to make the trade");

        //Create order for the order book and add it to the order book
        uint256 timeStamp = block.timestamp;
        currentOffers[Counters.current(currentOrderId)] = OfferInfo(Counters.current(currentOrderId), _sell_amt, _sell_gem, _buy_amt, _buy_gem, msg.sender, _expires ,timeStamp,false);

        emit MakeOffer(_sell_amt, _sell_gem, _buy_amt, _buy_gem, msg.sender, _expires, timeStamp);

        //get current order id
        uint256 currentID = Counters.current(currentOrderId);

        //increment counter
        Counters.increment(currentOrderId);

        return currentID;

    }

    //Taker 
    function takeOffer(uint _order_id, uint _quantity) public preventRecursion {

        //Getting current offer
        OfferInfo memory currentOffer = currentOffers[_order_id];

        //Get amount that the seller is selling
        uint256 tokenSellAmount =  currentOffer.sell_amt;

        //check to see that it is ok to trade
        require(_quantity <= tokenSellAmount, "To much tokens for the trade");

        //Get order token
        address tokenAddress =  currentOffer.buy_gem;

        //Check if you have enought funds to take the order for a specfic token
        require(userTokens[msg.sender][tokenAddress] >= _quantity, "You don't have the required token amount to make the trade");

        //make sure that you are not taking more than the they are selling - price infered on exchange esimated price as not just a order price for fiat
        uint256 tradeAmount = _quantity.mul(currentOffer.buy_amt).div(currentOffer.sell_amt);

        //Make sure trade amount is valid
        require(tradeAmount == 0, "Trade amount is not valid");

        //Move the funds sell token from each user
        userTokens[currentOffer.owner][currentOffer.sell_gem].sub(currentOffer.sell_amt);
        userTokens[msg.sender][currentOffer.buy_gem].sub(currentOffer.buy_amt);

        //Add the token trades back
        userTokens[currentOffer.owner][currentOffer.buy_gem].add(currentOffer.buy_amt);
        userTokens[msg.sender][currentOffer.sell_gem].add(currentOffer.sell_amt);

        //Updating order information
        currentOffer.buy_amt.sub(_quantity);
        currentOffer.sell_amt.sub(tradeAmount);

        //transfer tokens on the coin contract??

        //Has the order been finished - reset the order
        if(currentOffer.sell_amt == 0){
            emit PartialFillOffer(currentOffer.sell_amt, currentOffer.sell_gem, currentOffer.buy_amt, currentOffer.buy_gem, currentOffer.owner, currentOffer.expires, block.timestamp);
            //Reset order
            delete currentOffers[_order_id]; 
        }
        else{
            emit FilledOffer(currentOffer.sell_amt, currentOffer.sell_gem, currentOffer.buy_amt, currentOffer.buy_gem, currentOffer.owner, currentOffer.expires, block.timestamp);
        }
    }

    //Cancel Order
    function cancelOffer(uint _order_id) public orderActive(_order_id) {
        //Make sure it is your order to cancel
        //Make sure it is an order and it is active
        //Make sure it has not been canceled or expired
        //Make sure order and account caller match up

        delete currentOffers[_order_id];

        //Remove the funds back to the account that called the function

    }

    



}









//Maker and Taker

//fillTrade - 

//placeOffer - fillOrkill - PartialOrder

//CancelOrder

//
