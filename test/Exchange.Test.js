const Exchange = artifacts.require("Exchange");
const MatchingEngine = artifacts.require("MatchingEngine");
const Testtoken1 = artifacts.require("Testtoken1");
const Testtoken2 = artifacts.require("Testtoken2");

const { default: BigNumber } = require('bignumber.js');
//Assertion Functions
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const {ToBigNum} = require('./helper/ToBigNum');


contract("Testtoken1", accounts => {

    //Create the token1 with supply as stated by the contracts constructor
    before(async () =>{
        this.token1 = await Testtoken1.new(1000);
    });

    describe('token1 attributes', () =>{

        it("has a correct name", async () =>{
            const name = await this.token1.name();
            assert.equal(name, "Test", "The token names do not match");
        });

        it("has a correct symbol", async () =>{
            const symbol = await this.token1.symbol();
            assert.equal(symbol, "TEST", "The token symbols do not match");
        }); 

        it("has a correct decimals", async () =>{
            const decimals = await this.token1.decimals();
            assert.equal(decimals, 18, "The token decimals do not match");
        }); 

        it("has a correct total supply", async () =>{
            const supply = new BigNumber(await this.token1.totalSupply());
            assert.equal(supply.toNumber(), ToBigNum(1000), "The tokens total supply does not match");
        });

        it("token1 initialed with account[0] having all the tokens - (token1 only for testing)", async () =>{
            const accountSupply = new BigNumber(await this.token1.balanceOf(accounts[0]));
            assert.equal(accountSupply.toNumber(), ToBigNum(1000).toNumber(), "account[0] does not have full token1 supply");
        });

        it("send a token1 to another account", async () => {
            await this.token1.transfer(accounts[1],new BigNumber((500 * (10**18))));
            const accountOneBalance = new BigNumber(await this.token1.balanceOf(accounts[1]));
            assert.equal(accountOneBalance.toNumber(), ToBigNum(500).toNumber(), "account[1] did not recieve any token1s");
        })

        it("making sure that account[0] does not have full supply", async () => {
            const accountSupply = new BigNumber(await this.token1.balanceOf(accounts[0]));
            assert.equal(accountSupply.toNumber(),ToBigNum(500).toNumber(), "account[0] does have full supply of token1");
        })

    });

});

contract("Exchange", (accounts) => {

    this.token1 = undefined;
    this.exchange = undefined;
    this.token2 = undefined;

    before(async () => {

    //Creating a token1 to use in the exchange
    this.token1 = await Testtoken1.deployed();
    this.token2 = await Testtoken2.deployed();

    //Transfering to some accounts for testing - accounts[0],accounts[1],accounts[2] should all have tokens1
    await this.token1.transfer(accounts[1],ToBigNum(100));
    await this.token1.transfer(accounts[2],ToBigNum(100));

    //Transfering to some accounts for testing - accounts[0],accounts[1],accounts[2] should all have token2
    await this.token2.transfer(accounts[1],ToBigNum(100));
    await this.token2.transfer(accounts[2],ToBigNum(100));

    //Getting instsance of deployed contract
    this.exchange = await Exchange.deployed();

    //Approving contract usages for accounts
    await this.token1.approve(this.exchange.address,ToBigNum(100),{from: accounts[0]});
    await this.token1.approve(this.exchange.address,ToBigNum(100),{from: accounts[1]});
    await this.token1.approve(this.exchange.address,ToBigNum(100),{from: accounts[2]});

    await this.token2.approve(this.exchange.address,ToBigNum(100),{from: accounts[0]});
    await this.token2.approve(this.exchange.address,ToBigNum(100),{from: accounts[1]});
    await this.token2.approve(this.exchange.address,ToBigNum(100),{from: accounts[2]});
 
    });        

    describe("deposit function tests", () =>{

        it("is able to deposit into the cotract - account[0]", async () =>{
            await this.exchange.depositToken(this.token1.address,ToBigNum(10),{from: accounts[0]});
            const accountDetails = new BigNumber(await this.exchange.getBalance(this.token1.address,{from: accounts[0]}));
            assert.equal(accountDetails.toNumber(),ToBigNum(10),"account[0] was not able to send token1 to the exchange contract");
        });

        it("accounts can not give zero balance for a token1 amount", async () =>{
            try {
                await this.exchange.depositToken(this.token1.address,0,{from: accounts[0]});
                assert(false,"did not throw an error when it should have");
            } catch (error) {
                assert(true);
            }
        });

        it("accounts can not give negitive balance for a token1 amount", async () =>{
            try {
                await this.exchange.depositToken(this.token1.address,-10,{from: accounts[0]});
                assert(false,"did not throw an error when it should have");
            } catch (error) {
                assert(true);
            }
        });
    });

    describe("withdraw function tests", () =>{

        it("account[0] able to remove tokens from the contract when it has token1s in escrow", async ()=>{
            await this.exchange.withdrawToken(this.token1.address,ToBigNum(10),{from: accounts[0]});
            const accountDetails = new BigNumber(await this.exchange.getBalance(this.token1.address,{from: accounts[0]}));
            assert(accountDetails,0,"tokens not transfered out of the account");
        });

        it("account[0] token1s went back inot there acccount", async () =>{
            const accountSupply = new BigNumber(await this.token1.balanceOf(accounts[0]));
            assert(accountSupply, ToBigNum(800),"token1s not transfered back to account[0]");
        });

        it("account[0] cant withdraw token1s that it doesn't have", async () =>{
            try {
                await this.exchange.withdrawToken(this.token1.address,ToBigNum(10),{from: accounts[0]});
                assert(false, "Was supposed to throw an error")
            } catch (error) {
                assert(true);
            }
        });

        it("account[0] can't withdraw more token1s than it has in escrow", async () => {
            try {
                await this.exchange.depositToken(this.token1.address,ToBigNum(10),{from: accounts[0]});
                await this.exchange.withdrawToken(this.token1.address,ToBigNum(15),{from: accounts[0]});
                assert(false,"Was supposed to throw error");
            } catch (error) {
                assert(true);
            }
        });
    });

    describe("testing making an offer", () =>{

        it("account[0] is able to make an offer, and it is stored in the contract", async () =>{

            //Buy token2 sell token1 10 for 10
            await this.exchange.makeOffer(ToBigNum(10),this.token1.address,ToBigNum(10),this.token2.address,90,{from: accounts[0]});
            const orderOutput = await this.exchange.getOrderDetails(1);
            assert(orderOutput['id'] == 1,"id not equal to 1");
            assert(orderOutput['sell_amt'] == ToBigNum(10), "sell amount not equal to 10");
            assert(orderOutput['buy_amt'] == ToBigNum(10), "buy amount not equal to 10");
            assert(orderOutput['sell_token'] == this.token1.address, "token 1 address is not the same");
            assert(orderOutput['buy_token'] == this.token2.address, "token 2 address is not the same");
            assert(orderOutput['owner'] == accounts[0], "owner address is not the same as");
        });

        it("account[1] is able to make an offer, and it is stored in the contract", async ()=>{

            await this.exchange.depositToken(this.token2.address,ToBigNum(10),{from: accounts[1]});
            //Buy token2 sell token1 10 for 10
            await this.exchange.makeOffer(ToBigNum(10),this.token2.address,ToBigNum(10),this.token1.address,90,{from: accounts[1]});
            const orderOutput = await this.exchange.getOrderDetails(2);
            assert(orderOutput['id'] == 2,"id not equal to 2");
            assert(orderOutput['sell_amt'] == ToBigNum(10), "sell amount not equal to 10");
            assert(orderOutput['buy_amt'] == ToBigNum(10), "buy amount not equal to 10");
            assert(orderOutput['sell_token'] == this.token2.address, "token 1 address is not the same");
            assert(orderOutput['buy_token'] == this.token1.address, "token 2 address is not the same");
            assert(orderOutput['owner'] == accounts[1], "owner address is not the same as");
        });
    });

    describe("testing taking an offer", () =>{

        it("because account[1] made an offer, there tokens should be in escrow", async ()=>{
            const bal = new BigNumber(await this.exchange.getBalance(this.token2.address,{from: accounts[1]}));
            assert(bal,0,"account[1] tokens not in escrow");
        });

        it("can take a currently loaded order", async () => {
    
            await this.exchange.depositToken(this.token1.address,ToBigNum(10),{from: accounts[2]});

            const tx = await this.exchange.takeOffer(2,ToBigNum(10),{from: accounts[2]});

            const orderOutput = await this.exchange.getOrderDetails(2);

            //console.log(orderOutput);

            truffleAssert.eventEmitted(tx, 'FilledOffer');
            assert(orderOutput['sell_amt'] == 0, "sell amount not equal to 0");
            assert(orderOutput['buy_amt'] == 0, "buy amount not equal to 0");

            const bal = new BigNumber(await this.exchange.getBalance(this.token2.address,{from: accounts[2]}));
            assert(bal,ToBigNum(10),"Not the right updated  balances");
    
            
        });

        it("balances are updated for each trading account", async () => {
            const bal1 = new BigNumber(await this.exchange.getBalance(this.token2.address,{from: accounts[1]}));
            const bal2 = new BigNumber(await this.exchange.getBalance(this.token2.address,{from: accounts[2]}));

            assert(bal1, ToBigNum(0),"account[1] balance not updated");
            assert(bal2, ToBigNum(10),"account[2] balance not updated");

            const bal3 = new BigNumber(await this.exchange.getBalance(this.token1.address, {from: accounts[1]}));
            const bal4 = new BigNumber(await this.exchange.getBalance(this.token1.address, {from: accounts[2]}));

            assert(bal3,ToBigNum(10),"account[1] balance not updated for token one trade");
            assert(bal4,0,"account[2] balance not updated for token one trade");
        });

        it("partial orders can be made and the order is updated", async () =>{

            //Making offer - reverse of previous offer
            await this.exchange.makeOffer(ToBigNum(10),this.token2.address,ToBigNum(10),this.token1.address,90,{from: accounts[2]});

            const orderOutput = await this.exchange.getOrderDetails(3);
            assert(orderOutput['id'] == 3,"id not equal to 3");
            assert(orderOutput['sell_amt'] == ToBigNum(10), "sell amount not equal to 10");
            assert(orderOutput['buy_amt'] == ToBigNum(10), "buy amount not equal to 10");
            assert(orderOutput['sell_token'] == this.token2.address, "token 1 address is not the same");
            assert(orderOutput['buy_token'] == this.token1.address, "token 2 address is not the same");
            assert(orderOutput['owner'] == accounts[2], "owner address is not the same as");

            const bal = new BigNumber(await this.exchange.getBalance(this.token1.address,{from: accounts[1]}));
            assert(bal.toNumber() > ToBigNum(5).toNumber(),"account[1] does have enough to trade with");

            const tx = await this.exchange.takeOffer(3,ToBigNum(5),{from: accounts[1]});
            truffleAssert.eventEmitted(tx, 'PartialFillOffer');

            const orderOutput1 = await this.exchange.getOrderDetails(3);
            assert(orderOutput1['id'] == 3,"id not equal to 3");
            assert(orderOutput1['sell_amt'] == ToBigNum(5), "sell amount not equal to 10");
            assert(orderOutput1['buy_amt'] == ToBigNum(5), "buy amount not equal to 10");
            assert(orderOutput1['sell_token'] == this.token2.address, "token 1 address is not the same");
            assert(orderOutput1['buy_token'] == this.token1.address, "token 2 address is not the same");
            assert(orderOutput1['owner'] == accounts[2], "owner address is not the same as");
        });

        it("complete partial order from previous test", async ()=> {
            const tx = await this.exchange.takeOffer(3,ToBigNum(5),{from: accounts[1]});
            truffleAssert.eventEmitted(tx, 'FilledOffer');
            const orderOutput = await this.exchange.getOrderDetails(3);
            assert(orderOutput['sell_amt'] == 0, "sell amount not equal to 0");
            assert(orderOutput['buy_amt'] == 0, "buy amount not equal to 0");
        });

    });

    describe("testing canceling an offer", () =>{

        before(async ()=>{
            //Making offer - reverse of previous offer
            await this.exchange.makeOffer(ToBigNum(10),this.token2.address,ToBigNum(10),this.token1.address,90,{from: accounts[1]});
        });

        it("make sure order can not be canceled by account who did not make the order", async () =>{
            try {
                const tx = await this.exchange.cancelOffer(4);
                assert(false,"Was supposed to throw error");
            } catch (error) {
                assert(true);
            }
        });

        it("make sure order can be canceled by account who created it", async () =>{
            

            const tx = await this.exchange.cancelOffer(4,{from: accounts[1]});
            truffleAssert.eventEmitted(tx,"CanceledOffer");
            const orderOutput = await this.exchange.getOrderDetails(4);

            assert(orderOutput['sell_amt'] == 0, "sell amount not equal to 0");
            assert(orderOutput['buy_amt'] == 0, "buy amount not equal to 0");

        });

    });

});



