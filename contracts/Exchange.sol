//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

//Importing contract
//import "./MatchingEngine.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "prb-math/contracts/PRBMathUD60x18.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
@title Exchange Contract
*/
contract Exchange {

    //Importing Libraries
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    using PRBMathUD60x18 for uint256;
    using ECDSA for bytes32;
   
    //Centra DEX public key
    address constant internal centra_DEX_address = 0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E;

    //Seen Nonces - to prevent replay attacks
    //mapping(address => mapping(uint256 => bool)) internal  seenNonces;

    //Storage
    mapping(address => mapping(address => uint256)) internal usertokens; //Maps token balances for an account

    //Order Mappings
    mapping(uint256 => OfferInfo) public currentOffers;

    //State Variables
    Counters.Counter internal currentOrderId;

    //Constructor
    constructor() {
        //Increment the counter so it starts at one for the search tree
        Counters.increment(currentOrderId);
    } 

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
        bool orderFilled; // <-- false as default true when order is canceled or filled
        
    }
    
    //Internal Structs used to communicate with off chain
    struct order {
        uint sell_amt;
        address sell_token;
        uint buy_amt;
        address buy_token;
        address owner;
        bytes signature;
    }

    struct tradeData {
        address taker_address;
        address taker_token;
        uint taker_sell_amt;
        address maker_address;
        address maker_token;
        uint maker_buy_amt;
    }

    //Events
    event MakeOffer(uint id, uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event PartialFillOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event FilledOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event Deposit(address token,address user, uint256 amount, uint256 balance);
    event Withdraw(address token,address user,uint256 amount,uint256 balance);
    event CanceledOffer(uint sell_amt, address sell_token, uint buy_amt, address buy_token, address owner, uint256 expires, uint256 timeStamp);
    event TradeSettled(address taker_address, address taker_token, uint taker_sell_amt, address maker_address, address maker_token, uint maker_buy_amt);


    //Modifiers
    bool internal mutex = false;//global mutex variable
    
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
    @dev Checks that the signature comes from CENTRA
    @param _signature the signature of the order
    @param _tradeData the trade data for the function call
    @param _centra_signature the signature from CENTRA
     */ 
    modifier verifyCentraSig (
        bytes memory _signature,
        tradeData memory _tradeData,
        bytes memory _centra_signature
    ) { 
        //checking that signature for centra backend did not change
        require(keccak256(abi.encodePacked(
            _signature,
            _tradeData.taker_address,
            _tradeData.taker_token,
            _tradeData.taker_sell_amt,
            _tradeData.maker_address,
            _tradeData.maker_token,
            _tradeData.maker_buy_amt
        )).toEthSignedMessageHash()
          .recover(_centra_signature) == centra_DEX_address, "1");
          
        //Return to function
        _;
    }

    /**
    @dev Checks that the signature comes from CENTRA
    @param _order the order data
    */
    modifier verifyOrderSig(
        order memory _order
    ) {
        //checking that the orders owner signed the order
        require(keccak256(abi.encodePacked(
            _order.sell_amt,
            _order.sell_token,
            _order.buy_amt,
            _order.buy_token,
            _order.owner
        )).toEthSignedMessageHash()
          .recover(_order.signature) == _order.owner, "2");

        //Return to function
        _;
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
        require(_tokenAmount != 0,"Token amount is set to zero, please specify amount greater than 0");

        //Creating an interface for the token
        IERC20 _token = IERC20(_tokenAddress);

        //Call for the token
        _token.safeTransferFrom(msg.sender, address(this), _tokenAmount);

        //Save that the user has deposited the token into the contract
        usertokens[msg.sender][_tokenAddress] = usertokens[msg.sender][_tokenAddress].add(_tokenAmount);

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
    function makeOffer(uint _sell_amt, address _sell_token, uint _buy_amt, address _buy_token, uint256 _expires) public virtual returns (uint256) {

        //Perform Checks for eth
        require(address(_sell_token) != address(0x0),"This is Ether, Please only sell an ERC20 compliant token");
        require(address(_buy_token) != address(0x0),"This is Ether, Please only buy an ERC20 compliant token");
        
        //check reentrancy 

        //Checking to make sure they are not the same tokens
        require(_sell_token != _buy_token, "These tokens are the same, please place an offer with different tokens");
        
        //Make sure that they have enough funds for transfer
        require(usertokens[msg.sender][_sell_token] >= _sell_amt, "You don't have enought funds to make the trade");

        //Remove ability to trade funds - lock them up for the trade
        usertokens[msg.sender][_sell_token] = usertokens[msg.sender][_sell_token].sub(_sell_amt); 

        //Create order for the order book and add it to the order book
        uint256 timeStamp = block.timestamp;
        currentOffers[Counters.current(currentOrderId)] = OfferInfo(Counters.current(currentOrderId), _sell_amt, _sell_token, _buy_amt, _buy_token, msg.sender, _expires ,timeStamp,false);

        emit MakeOffer(Counters.current(currentOrderId),_sell_amt, _sell_token, _buy_amt, _buy_token, msg.sender, _expires, timeStamp);

        //Storing current return value
        uint256 returnValue = Counters.current(currentOrderId);

        //increment counter
        Counters.increment(currentOrderId);

        return returnValue;

    }

    event TradeAmount(uint256 tradeAmount);
    //event AddressGet(address add);

    /**
    //Takes a current offer
    @param _order_id The id of the order you want to fill
    @param _quantity The amount of the order you want to fill
     */
    function takeOffer(uint _order_id, uint _quantity) public virtual preventRecursion {

        //Getting current offer
        OfferInfo storage currentOffer = currentOffers[_order_id];

        //Check expiry date

        //Get amount that the seller is selling
        uint256 tokenSellAmount =  currentOffers[_order_id].sell_amt;

        //check to see that it is ok to trade
        require(_quantity <= tokenSellAmount, "To much tokens for the trade");

        //Get order token
        address tokenAddress = currentOffer.buy_token;

        //Check if you have enought funds to take the order for a specfic token
        require(usertokens[msg.sender][tokenAddress] >= _quantity, "You don't have the required token amount to make the trade");

        //make sure that you are not taking more than the they are selling - price infered on exchange esimated price as not just a order price for fiat
        //uint256 tradeAmount = _quantity.mul(currentOffer.buy_amt).div(currentOffer.sell_amt);
        uint256 tradeAmountMul = PRBMathUD60x18.mul(_quantity,currentOffer.buy_amt);
        uint256 tradeAmount = PRBMathUD60x18.div(tradeAmountMul,currentOffer.sell_amt);

        //Make sure trade amount is valid
        require(tradeAmount >= 0, "Trade amount is not valid");
        
        //Renstate the owners ablity to trade funds that they put up for sale - by how much the owner is willig to pay
        usertokens[currentOffer.owner][currentOffer.sell_token] = usertokens[currentOffer.owner][currentOffer.sell_token].add(_quantity);

        //Move the funds sell token from each user   
        usertokens[currentOffer.owner][currentOffer.sell_token] = usertokens[currentOffer.owner][currentOffer.sell_token].sub(_quantity);   
        usertokens[msg.sender][currentOffer.buy_token] = usertokens[msg.sender][currentOffer.buy_token].sub(tradeAmount);

        //Add the token trades back
        usertokens[currentOffer.owner][currentOffer.buy_token] = usertokens[currentOffer.owner][currentOffer.buy_token].add(tradeAmount);
        usertokens[msg.sender][currentOffer.sell_token] = usertokens[msg.sender][currentOffer.sell_token].add(_quantity);

        //Updating order information
        currentOffer.buy_amt = currentOffer.buy_amt.sub(tradeAmount);
        currentOffer.sell_amt = currentOffer.sell_amt.sub(_quantity);

        //transfer tokens on the coin contract??

        //Has the order been finished - reset the order
        if(currentOffer.sell_amt == 0){
            emit FilledOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);
            //Reset order
            delete currentOffers[_order_id];
        }
        else{
            emit PartialFillOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);

        }
    }

    /**
    //Cancels the current order
    @param _order_id the id of the order to cancel - can only cancel if you are owner of the order
     */
    function cancelOffer(uint _order_id) public virtual orderActive(_order_id) {

        OfferInfo memory currentOffer = currentOffers[_order_id];

        //Make sure that only the order can be cancel by the order creator
        require(currentOffer.owner == msg.sender, "You are not the order creator");

        //Emiting event
        emit CanceledOffer(currentOffer.sell_amt, currentOffer.sell_token, currentOffer.buy_amt, currentOffer.buy_token, currentOffer.owner, currentOffer.expires, block.timestamp);

        //Reseting order
        delete currentOffers[_order_id];

    }

   //need to use a nonce - have a list of seen nonces
    function offChainTrade(order memory _order, tradeData memory _tradeData, bytes memory _centra_signature) public verifyOrderSig(_order) verifyCentraSig( _order.signature, _tradeData, _centra_signature){
        
        require(msg.sender == _tradeData.taker_address, "3");

        //Check that the taker and maker both have funds
        require(usertokens[_tradeData.taker_address][_tradeData.taker_token] >= _tradeData.taker_sell_amt, "Not enough tokens 1");
        require(usertokens[_tradeData.maker_address][_tradeData.maker_token] >= _tradeData.maker_buy_amt, "Not enough tokens 2");

        //Make the trade
        usertokens[_tradeData.taker_address][_tradeData.taker_token] = usertokens[_tradeData.taker_address][_tradeData.taker_token].sub(_tradeData.taker_sell_amt);      
        usertokens[_tradeData.maker_address][_tradeData.maker_token] = usertokens[_tradeData.maker_address][_tradeData.maker_token].sub(_tradeData.maker_buy_amt);
        
        usertokens[_tradeData.taker_address][_tradeData.maker_token] = usertokens[_tradeData.taker_address][_tradeData.maker_token].add(_tradeData.maker_buy_amt);      
        usertokens[_tradeData.maker_address][_tradeData.taker_token] = usertokens[_tradeData.maker_address][_tradeData.taker_token].add(_tradeData.taker_sell_amt);

        //Trade settled
        emit TradeSettled(_tradeData.taker_address, _tradeData.taker_token, _tradeData.taker_sell_amt, _tradeData.maker_address, _tradeData.maker_token, _tradeData.maker_buy_amt);

    }
}
