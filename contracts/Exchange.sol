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
    mapping(address => mapping(address => uint256)) private usertokens; //Maps token balances for an account

    //Order Mappings
    mapping(uint256 => OfferInfo) public currentOffers;

    //State Variables
    Counters.Counter private currentOrderId;

    //Offer Struct
    struct OfferInfo {
        uint256    id;        // <-- order id  
        uint     sell_amt;   // <-- amount to pay/sell (wei)
        address  sell_token;   // <-- address of token
        uint     buy_amt;   // <-- amount to buy (wei)
        address  buy_token;   // <-- address of token
        address  owner;    // <-- who created the offer
        uint256  expires;    // <-- when the offer expires
        uint256  timestamp; // <-- when offer was created
        bool     orderFilled; // <-- false as default true when order is canceled or filled
    }

    //Events
    event MakeOffer(uint id, uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event PartialFillOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event FilledOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event Deposit(address token,address user, uint256 amount, uint256 balance);
    event Withdraw(address token,address user,uint256 amount,uint256 balance);
    event CanceledOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);

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
    Deposit ERC20 token into the contract
    @param _tokenAddress The address of the token you want to deposit into the contract
    @param _tokenAmount The amount of the token you want to deposit into the escrow 
    @notice Please use this function to deposit tokens into the contract,
    as they will therefore be tracked by the contract
    */
    function depositToken(address _tokenAddress, uint256 _tokenAmount) public  {

        require(address(_tokenAddress) != address(0x0),"This is Ether, Please deposit a ERC20 compliant token");

        require(_tokenAmount != 0,"token amoount is set to zero, please specifier amount greater than 0");

        //Creating an interface for the token
        IERC20 _token = IERC20(_tokenAddress);

        //Call for the token by the user
        _token.safeTransferFrom(msg.sender, address(this), _tokenAmount);

        //Save that the user has deposited the token into the contract
        usertokens[msg.sender][_tokenAddress] = usertokens[msg.sender][_tokenAddress].add(_tokenAmount); //NEED TO CHECK THIS

        //emit an event
        emit Deposit(_tokenAddress,msg.sender,_tokenAmount,usertokens[msg.sender][_tokenAddress]);
    }

    /**
    Withdraw certain ERC-20 token
    @param _tokenAddress The address of the token you want to withdraw from the contract
    @param _tokenAmount The amount of the token you want to withdraw from the contract
    */
    function withdrawToken(address _tokenAddress, uint256 _tokenAmount) public preventRecursion {

        //Check they actually have a balance for the token
        require(usertokens[msg.sender][_tokenAddress] >= _tokenAmount,"You do not have enough tokens to withdraw");

        //Creating an interface for the token
        IERC20 _token = IERC20(_tokenAddress);

        //Save that the user has withdrawn the token into the contract
        usertokens[msg.sender][_tokenAddress] = usertokens[msg.sender][_tokenAddress].sub(_tokenAmount); //NEED TO CHECK THIS

        //Transfering token to users account
        _token.safeTransfer(msg.sender, _tokenAmount);

        //emit an event
        emit Withdraw(_tokenAddress,msg.sender,_tokenAmount,usertokens[msg.sender][_tokenAddress]);
    }

    /**
    Gets the users balance for a particular token
    @param _tokenAddress The token you want the balance for
    */
    function getBalance(address _tokenAddress) external view returns (uint256) {
        return usertokens[msg.sender][_tokenAddress];
    }

    /**
    @param _order_id The id of the order you want to retrieve
    */
    function getOrderDetails(uint256 _order_id) external view returns (OfferInfo memory){
        return currentOffers[_order_id];
    }

    /**
    //Make offer for trade
    @param _sell_amt The amount of the token you want to sell
    @param _sell_token The address of the token you want to sell
    @param _buy_amt The amount of tokens you want to buy for
    @param _buy_token The address of the tokens you wan to buy
    @param _expires when the order expires
     */
    function makeOffer(uint _sell_amt, address _sell_token, uint _buy_amt, address _buy_token, uint256 _expires) public {

        //Perform Checks for eth
        
        //check reentrancy 
        
        //Make sure that they have enough funds for transfer
        require(usertokens[msg.sender][_sell_token] >= _sell_amt, "You don't have enought funds to make the trade");

        //Remove ability to trade funds - lock them up for the trade
        usertokens[msg.sender][_sell_token].sub(_sell_amt); 

        //Create order for the order book and add it to the order book
        uint256 timeStamp = block.timestamp;
        currentOffers[Counters.current(currentOrderId)] = OfferInfo(Counters.current(currentOrderId), _sell_amt, _sell_token, _buy_amt, _buy_token, msg.sender, _expires ,timeStamp,false);

        emit MakeOffer(Counters.current(currentOrderId),_sell_amt, _sell_token, _buy_amt, _buy_token, msg.sender, _expires, timeStamp);

        //increment counter
        Counters.increment(currentOrderId);

    }

    /**
    //Takes a current offer
    @param _order_id The id of the order you want to fill
    @param _quantity The amount of the order you want to fill
     */
    function takeOffer(uint _order_id, uint _quantity) public preventRecursion {

        //Getting current offer
        OfferInfo memory currentOffer = currentOffers[_order_id];

        //Check expiry date

        //Get amount that the seller is selling
        uint256 tokenSellAmount =  currentOffer.sell_amt;

        //check to see that it is ok to trade
        require(_quantity <= tokenSellAmount, "To much tokens for the trade");

        //Get order token
        address tokenAddress =  currentOffer.buy_token;

        //Check if you have enought funds to take the order for a specfic token
        require(usertokens[msg.sender][tokenAddress] >= _quantity, "You don't have the required token amount to make the trade");

        //make sure that you are not taking more than the they are selling - price infered on exchange esimated price as not just a order price for fiat
        uint256 tradeAmount = _quantity.mul(currentOffer.buy_amt).div(currentOffer.sell_amt);

        //Make sure trade amount is valid
        require(tradeAmount == 0, "Trade amount is not valid");

        //Renstate the owners ablity to trade funds that they put up for sale - by how much the owner is willig to pay
        usertokens[currentOffer.owner][currentOffer.sell_token].add(_quantity);

        //Move the funds sell token from each user
        usertokens[currentOffer.owner][currentOffer.sell_token].sub(currentOffer.sell_amt);
        usertokens[msg.sender][currentOffer.buy_token].sub(currentOffer.buy_amt);

        //Add the token trades back
        usertokens[currentOffer.owner][currentOffer.buy_token].add(currentOffer.buy_amt);
        usertokens[msg.sender][currentOffer.sell_token].add(currentOffer.sell_amt);

        //Updating order information
        currentOffer.buy_amt.sub(_quantity);
        currentOffer.sell_amt.sub(tradeAmount);

        //transfer tokens on the coin contract??

        //Has the order been finished - reset the order
        if(currentOffer.sell_amt == 0){
            emit PartialFillOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);
            //Reset order
            delete currentOffers[_order_id]; 
        }
        else{
            emit FilledOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);
        }
    }

    /**
    //Cancels the current order
    @param _order_id the id of the order to cancel - can only cancel if you are owner of the order
     */
    function cancelOffer(uint _order_id) public orderActive(_order_id) {

        OfferInfo memory currentOffer = currentOffers[_order_id];

        //Make sure that only the order can be cancel by the order creator
        require(currentOffer.owner == msg.sender, "You are not the order creator");

        //Emiting event
        emit CanceledOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);

        //Reseting order
        delete currentOffers[_order_id];

    }
}









//Maker and Taker

//fillTrade - 

//placeOffer - fillOrkill - PartialOrder

//CancelOrder

//
