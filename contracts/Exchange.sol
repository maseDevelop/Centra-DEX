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
    using Counters for uint256;

    //Seen Nonces - to prevent replay attacks
    mapping(address => mapping(uint256 => bool)) private seenNonces;

    //Storage
    mapping(address => mapping(address => uint256)) private userTokens; //Maps token balances for an account

    //State Variables
    uint256 internal currentOrderId = 0;

    //Events
    event Order(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 expires,
        uint256 nonce,
        address user
    );
    event Cancel(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 expires,
        uint256 nonce,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s
    );
    event Trade(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address get,
        address give
    );
    event PartialFill(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 expires,
        uint256 nonce,
        address user,
        address taker,
        uint256 takerAmount
    );
    event OrderFilled(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 expires,
        uint256 nonce,
        address user
    );
    event Deposit(
        address token,
        address user, 
        uint256 amount, 
        uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event OrderExpired(
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 expires,
        uint256 nonce,
        address user
    );

    /**
    Deposit ERC20 Token into the contract
    @param _tokenAddress The address of the token you want to deposit into the contract
    @param _tokenAmount The amount of the token you want to deposit into the escrow 
    @notice Please use this function to deposit tokens into the contract,
    as they will therefore be tracked by the contract
    */
    function depositToken(address _tokenAddress, uint256 _tokenAmount) public {

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
    function withdrawToken(address _tokenAddress, uint256 _tokenAmount) public {

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
    function placeOffer(uint _pay_amt, address _pay_gem, uint _buy_amt, address _buy_gem) public returns (uint) {

        //add to the order book

    }

    //Taker 
    function fillOffer(uint _order_id, uint _quantity) public {

        //Remove from order book

    }

    



}









//Maker and Taker

//fillTrade - 

//placeOffer - fillOrkill - PartialOrder

//CancelOrder

//
