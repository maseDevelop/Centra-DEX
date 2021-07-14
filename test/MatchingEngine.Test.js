const MatchingEngine = artifacts.require("MatchingEngine");
const Testtoken1 = artifacts.require("Testtoken1");
const Testtoken2 = artifacts.require("Testtoken2");
const TestBokkyPooBahsRedBlackTreeRaw = artifacts.require("TestBokkyPooBahsRedBlackTreeRaw");

const { assert } = require('chai');
//Truffle asserts 
const truffleAssert = require('truffle-assertions');

//Testing binary tree library
contract("TestBokkyPooBahsRedBlackTreeRaw", (accounts) => {

    this.tree = undefined;

    before(async () => {
        this.tree = await TestBokkyPooBahsRedBlackTreeRaw.deployed();
    })

    describe("Testing Inserting", () =>{

        it("Making sure there are no orders in the tree", async () =>{
            const out = await this.tree.root()
            assert.equal(out.toNumber(),0);
        });

        it("Inserting order into the tree, and making sure it is the root", async () =>{
            await this.tree.insert(5,1);
            //It should now be the root
            const root = await this.tree.root()
            assert.equal(root.toNumber(),1,"root node not intialised");
        });

        it("Inserting another order in the tree lower than the previous", async () =>{
            await this.tree.insert(4,2);
            const lowestID = await this.tree.first();
            assert.equal(lowestID.toNumber(),2,"the lowest value is wrong for the ID");
        });

        it("Inserting another order in the tree higher than the previous", async () =>{
            await this.tree.insert(6,3);
            const highestID = await this.tree.last();
            assert.equal(highestID.toNumber(),3,"the highest value is wrong for the ID");
        });

        it("Checking the tree order", async () =>{
            const out1 = await this.tree.next(2);
            const out2 = await this.tree.next(1);
            const out3 = await this.tree.next(3);

            //2 -> 1 -> 3
            assert.equal(out1.toNumber(),1,"value is not ID 1");
            assert.equal(out2.toNumber(),3,"value is not ID 3");
            assert.equal(out3.toNumber(),0,"value is not zero"); //Because it last should be zero
        });

        it("Inserting another value with the same price and checking the values are correct", async () =>{
            await this.tree.insert(6,4);
            const out1 = await this.tree.next(2);
            const out2 = await this.tree.next(1);
            const out3 = await this.tree.next(3);
            const out4 = await this.tree.next(4);

            //2 -> 1 -> 3
            assert.equal(out1.toNumber(),1,"value is not ID 1");
            assert.equal(out2.toNumber(),3,"value is not ID 3");
            assert.equal(out3.toNumber(),4,"value is not ID 4");
            assert.equal(out4.toNumber(),0,"value is not zero"); //Because it last should be zero

        });

        
        it("Inserting another value with in the middle of the values and checking they are correct", async () =>{
            await this.tree.insert(5,5);
            const out1 = await this.tree.next(2);
            const out2 = await this.tree.next(1);
            const out3 = await this.tree.next(3);  
            const out4 = await this.tree.next(4);
            const out5 = await this.tree.next(5);

            //2 -> 1 -> 3
            assert.equal(out1.toNumber(),1,"value is not ID 1");
            assert.equal(out2.toNumber(),5,"value is not ID 3");
            assert.equal(out3.toNumber(),4,"value is not ID 4");
            assert.equal(out5.toNumber(),3,"value is not ID 3");
            assert.equal(out4.toNumber(),0,"value is not zero"); //Because it last should be zero

        });

    });

    describe("Testing removing", () =>{


    })

});

contract("MatchingEngine", (accounts) => {

    this.matchingEngine = undefined;
    this.token1 = undefined;
    this.token2 = undefined;

    before(async () => {

        //Creating a token1 to use in the exchange
        this.token1 = await Testtoken1.deployed();
        this.token2 = await Testtoken2.deployed();

        //Creating a token for the matching engine
        this.matchingEngine = await MatchingEngine.deployed();

    })

    describe("Initial setup testing", () =>{

        it("matching engine is not currently active", async () =>{
            
            const value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,false, "The trading engine started out working and should be false");
        });
    });

    describe("Testing insertion method", () =>{

        it("making sure that there are no orders active", async () =>{
            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address)
            assert(out,0,"The orders are not intialised to zero")
        });

        it("making sure that an order shows up when inserted into the tree", async () =>{
            await this.matchingEngine.insert(5, 1, this.token1.address, this.token2.address);
            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.strictEqual(out.toNumber(),1, "Wrong ID is outputed");
        });

        it("making sure that an order shows up when inserted into the tree before previous orders as it is cheaper", async () =>{
            await this.matchingEngine.insert(4, 2, this.token1.address, this.token2.address);
            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.strictEqual(out.toNumber(),2, "Wrong ID is outputed");
        });

        it("making sure that an order shows up when inserted into the tree after previous orders as it is dearer", async () =>{
            await this.matchingEngine.insert(6, 3, this.token1.address, this.token2.address);
            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            //Should still be the same ID
            assert.strictEqual(out.toNumber(),2, "Wrong ID is outputed");
        });

        it("making sure that an order shows as the biggest dearest order has the right id", async () =>{
            //await this.matchingEngine.insert(6, 3, this.token1.address, this.token2.address);
            const out = await this.matchingEngine.getLastOffer(this.token1.address, this.token2.address);
            const out1 = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            //Should still be the same ID
            assert.strictEqual(out.toNumber(),3, "Wrong ID is outputed for highest price ID");
            assert.strictEqual(out1.toNumber(),2, "Wrong ID is outputed for lowest price ID");
        });

    });

});