const Exchange = artifacts.require("Exchange");
const TestToken = artifacts.require("TestToken");

contract("TestToken", accounts => {

    //Create the token with supply as stated by the contracts constructor
    before(async () =>{
        this.token = await TestToken.new(1000);
    });

    describe('token attributes', () =>{

        it("has a correct name", async () =>{
            const name = await this.token.name();
            assert.equal(name, "Test", "The token names do not match");
        });

        it("has a correct symbol", async () =>{
            const symbol = await this.token.symbol();
            assert.equal(symbol, "TEST", "The token symbols do not match");
        }); 

        it("has a correct decimals", async () =>{
            const decimals = await this.token.decimals();
            assert.equal(decimals, 18, "The token decimals do not match");
        }); 

        it("has a correct total supply", async () =>{
            const supply = await this.token.totalSupply();
            assert.equal(supply.toNumber(), 1000, "The tokens total supply does not match");
        });

        it("token initialed with account[0] having all the tokens - (token only for testing)", async () =>{
            const accountSupply = await this.token.balanceOf(accounts[0]);
            assert.equal(accountSupply.toNumber(), 1000, "account[0] does not have full token supply");
        });

        it("send a token to another account", async () => {
            await this.token.transfer(accounts[1],500);
            const accountOneBalance = await this.token.balanceOf(accounts[1]);
            assert.equal(accountOneBalance.toNumber(), 500, "account[1] did not recieve any tokens");
        })

        it("making sure that account[0] does not have full supply", async () => {
            const accountSupply = await this.token.balanceOf(accounts[0]);
            assert.equal(accountSupply.toNumber(), 500, "account[0] does have full supply of token");
        })

    });

});

contract("Exchange", (accounts) => {

    this.token = undefined;
    this.exchange = undefined;

    before(async () => {
    //Creating a token to use in the exchange
    this.token = await TestToken.deployed();

    //Transfering to some accounts for testing - accounts[0],accounts[1],accounts[2] should all have tokens
    await this.token.transfer(accounts[1],100);
    await this.token.transfer(accounts[2],100);

    //Getting instsance of deployed contract
    this.exchange = await Exchange.deployed();

    //Approving contract usages for accounts
    await this.token.approve(this.exchange.address,100,{from: accounts[0]});
    await this.token.approve(this.exchange.address,100,{from: accounts[1]});
    await this.token.approve(this.exchange.address,100,{from: accounts[2]});
 
    });        

    describe("deposit function tests", () =>{

        it("is able to deposit into the cotract - account[0]", async () =>{
            await this.exchange.depositToken(this.token.address,10,{from: accounts[0]});
            const accountDetails = await this.exchange.getBalance(this.token.address,{from: accounts[0]});
            assert.equal(accountDetails.toNumber(),10,"account[0] was not able to send token to the exchange contract");
        });

        it("accounts can not give zero balance for a token amount", async () =>{
            try {
                await this.exchange.depositToken(this.token.address,0,{from: accounts[0]});
                assert(false,"did not throw an error when it should have");
            } catch (error) {
                assert(true);
            }
        });

        it("accounts can not give negitive balance for a token amount", async () =>{
            try {
                await this.exchange.depositToken(this.token.address,-10,{from: accounts[0]});
                assert(false,"did not throw an error when it should have");
            } catch (error) {
                assert(true);
            }
        });
    });

    describe("withdraw function tests", () =>{

        it("account[0] able to remove tokens from the contract when it has tokens in escrow", async ()=>{
            await this.exchange.withdrawToken(this.token.address,10,{from: accounts[0]});
            const accountDetails = await this.exchange.getBalance(this.token.address,{from: accounts[0]});
            assert(accountDetails,0,"tokens not transfered out of the account");
        });

        it("account[0] tokens went back inot there acccount", async () =>{
            const accountSupply = await this.token.balanceOf(accounts[0]);
            assert(800,accountSupply,"tokens not transfered back to account[0]");
        });

        it("account[0] cant withdraw tokens that it doesn't have", async () =>{
            try {
                await this.exchange.withdrawToken(this.token.address,10,{from: accounts[0]});
                assert(false, "Was supposed to throw an error")
            } catch (error) {
                assert(true);
            }
        });

        it("account[0] can't withdraw more tokens than it has in escrow", async () => {
            try {
                await this.exchange.depositToken(this.token.address,10,{from: accounts[0]});
                await this.exchange.withdrawToken(this.token.address,15,{from: accounts[0]});
                assert(false,"Was supposed to throw error")
            } catch (error) {
                assert(true);
            }
        });
    });
});