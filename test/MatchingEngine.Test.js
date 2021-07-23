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

            /*console.log(await this.tree.getNode(1));
            console.log(await this.tree.getNode(2));
            console.log(await this.tree.getNode(3));
            console.log(await this.tree.getNode(4));
            console.log(await this.tree.getNode(5));*/

            //2 -> 1 -> 3
            assert.equal(out1.toNumber(),1,"value is not ID 1");
            assert.equal(out2.toNumber(),5,"value is not ID 3");
            assert.equal(out3.toNumber(),4,"value is not ID 4");
            assert.equal(out5.toNumber(),3,"value is not ID 3");
            assert.equal(out4.toNumber(),0,"value is not zero"); //Because it last should be zero

        });

    });

    describe("Testing removing", () =>{

        it("Checking an ID can be removed properly", async () =>{
            try {
                await this.tree.remove(3);//4
                const out = await this.tree.getNode(3);
                assert(false,"ID 4 was not removed from the tree")
            } catch (error) {
                assert(true);
            }
        });

        it("checking that the structure of the tree is still good after removal", async ()=>{

            /*const out1 = await this.tree.getNode(1);
            const out2 = await this.tree.getNode(2);
            const out3 = await this.tree.getNode(4); 
            const out4 = await this.tree.getNode(5);

            console.log(out1);
            console.log(out2);
            console.log(out3);
            console.log(out4);*/

            const out1 = await this.tree.next(2);
            const out2 = await this.tree.next(1);
            const out3 = await this.tree.next(5);  
            const out4 = await this.tree.next(4);

            assert.equal(out1.toNumber(),1,"value is not ID 1");
            assert.equal(out2.toNumber(),5,"value is not ID 3");
            assert.equal(out3.toNumber(),4,"value is not ID 4");
            assert.equal(out4.toNumber(),0,"value is not zero"); //Because it last should be zero
   

        });

        it("Removing the root value to see if the price order stays the same", async ()=>{

            await this.tree.remove(1);
     
            /*console.log(await this.tree.getNode(2));
            console.log(await this.tree.getNode(4));
            console.log(await this.tree.getNode(5));*/

            //Checking if the order stays the same
            const out1 = await this.tree.next(2);
            const out3 = await this.tree.next(5);  
            const out4 = await this.tree.next(4);

            assert.equal(out1.toNumber(),5,"value is not ID 5");
            assert.equal(out3.toNumber(),4,"value is not ID 4");
            assert.equal(out4.toNumber(),0,"value is not zero"); //Because it last should be zero

        });

        it("Remove all values from the tree and check it the default value is reset", async () =>{
            //Removing all values from the tree
            await this.tree.remove(2);
            await this.tree.remove(5);
            await this.tree.remove(4);

            //Root value should be zero
            const rootValue = await this.tree.root();
            assert.equal(rootValue.toNumber(), 0);
        });

    });

    describe("Large Scale add and remove to a tree", () => {

        it("Adding 20 Orders into the tree and checking that they are sorted", async () => {

    

            await this.tree.insert(10,1);
            await this.tree.insert(5,2);
            await this.tree.insert(3,3);
            await this.tree.insert(77,4);
            await this.tree.insert(4,5);
            await this.tree.insert(5,6);
            await this.tree.insert(88,7);
            await this.tree.insert(1,8);
            await this.tree.insert(14,9);
            await this.tree.insert(11,10);
            await this.tree.insert(22,11);
            await this.tree.insert(21,12);
            await this.tree.insert(21,13);
            await this.tree.insert(77,14);
            await this.tree.insert(45,15);
            await this.tree.insert(57,16);
            await this.tree.insert(88,17);
            await this.tree.insert(19,18);
            await this.tree.insert(14,19);
            await this.tree.insert(11,20);


            //making sure that it is all in order
            let out = [];

             //Getting the smallest value
            let cursor = await this.tree.first();
            //out.push(cursor.toNumber());

            while(cursor != 0){
   
                //console.log("cursor: ",cursor.toNumber());
                await this.tree.getNode(cursor);
                cursor = await this.tree.next(cursor);
                out.push(cursor.toNumber());
            }

            /*out.forEach((item)=>{
                console.log(item);
            });*/


            assert.equal(out[0],3);
            assert.equal(out[1],5);
            assert.equal(out[2],2);
            assert.equal(out[3],6);
            assert.equal(out[4],1);
            assert.equal(out[5],10);
            assert.equal(out[6],20);
            assert.equal(out[7],9);
            assert.equal(out[8],19);
            assert.equal(out[9],18);
            assert.equal(out[10],12);
            assert.equal(out[11],13);
            assert.equal(out[12],11);
            assert.equal(out[13],15);
            assert.equal(out[14],16);
            assert.equal(out[15],4);
            assert.equal(out[16],14);
            assert.equal(out[17],7);
            assert.equal(out[18],17);
            assert.equal(out[19],0);//Has to be zero as it is the end

        });

        /*it.skip("Adding 20 orders into the tree and checking that they are sorted", async () =>{

            const insertPrices = [1,5,7,6,12,43,64,32,22,1,22,33,7,3,2,78,5,66,15,14];

            insertPrices.forEach(async (price,i) =>{
                //Adding the insertprice and ID into the tree
                console.log(`Price: ${price} ID: ${i+1}`);
                await this.tree.insert(price,i+1);
            });

            //making sure that it is all in order
            let out = [];

            //Getting the smallest value
            let cursor = await this.tree.first();

            console.log("cursor: ", cursor.toNumber());


            const root = await this.tree.root();

            console.log("root: ",root);

            console.log(await this.tree.getNode(2));
          
            while(cursor != 0){
                console.log("in")
                cursor = await this.tree.next(cursor);
                await this.tree.getNode(cursor);
                out.push(cursor.toNumber());
            }

            console.log("out:");
            out.forEach((item)=>{
                //console.log(item);

                


            });

            assert.equal(out[0],10);
            assert.equal(out[1].toNumber(),15);
            assert.equal(out[2].toNumber(),14);
            assert.equal(out[3].toNumber(),2);
            assert.equal(out[4].toNumber(),17);
            assert.equal(out[5].toNumber(),4);
            assert.equal(out[6].toNumber(),3);
            assert.equal(out[7].toNumber(),13);
            assert.equal(out[8].toNumber(),5);
            assert.equal(out[9].toNumber(),20);
            assert.equal(out[10].toNumber(),19);
            assert.equal(out[11].toNumber(),9);
            assert.equal(out[12].toNumber(),11);
            assert.equal(out[13].toNumber(),8);
            assert.equal(out[14].toNumber(),12);
            assert.equal(out[15].toNumber(),6);
            assert.equal(out[16].toNumber(),7);
            assert.equal(out[17].toNumber(),18);
            assert.equal(out[18].toNumber(),16);
            assert.equal(out[19].toNumber(),0);//Has to be zero as it is the end
        });*/

        it("remove some of the Ids and make sure the order is still alright", async () =>{



            await this.tree.remove(7);
            await this.tree.remove(8);
            await this.tree.remove(13);
            await this.tree.remove(16);
            await this.tree.remove(2);

            //making sure that it is all in order
            let out = [];

             //Getting the smallest value
            let cursor = await this.tree.first();
            //out.push(cursor.toNumber());

            while(cursor != 0){
                //console.log("cursor: ",cursor.toNumber());
                await this.tree.getNode(cursor);
                cursor = await this.tree.next(cursor);
                out.push(cursor.toNumber());
            }

            /*out.forEach((item)=>{
                console.log(item);
            });*/

            assert.equal(out[0],5);
            assert.equal(out[1],6);
            assert.equal(out[2],1);
            assert.equal(out[3],10);
            assert.equal(out[4],20);
            assert.equal(out[5],9);
            assert.equal(out[6],19);
            assert.equal(out[7],18);
            assert.equal(out[8],12);
            assert.equal(out[9],11);
            assert.equal(out[10],15);
            assert.equal(out[11],4);
            assert.equal(out[12],14);
            assert.equal(out[13],17);
            assert.equal(out[14],0);

        });

        it("Trying to update a value in the tree with a differnt price and the same ID", async ()=>{

            await this.tree.remove(9);
            
            //Updating price
            await this.tree.insert(23,9);

            //making sure that it is all in order
            let out = [];

             //Getting the smallest value
            let cursor = await this.tree.first();
            //out.push(cursor.toNumber());

            while(cursor != 0){
                //console.log("cursor: ",cursor.toNumber());
                await this.tree.getNode(cursor);
                cursor = await this.tree.next(cursor);
                out.push(cursor.toNumber());
            }

            /*out.forEach((item)=>{
                console.log(item);
            });*/

            assert.equal(out[0],5);
            assert.equal(out[1],6);
            assert.equal(out[2],1);
            assert.equal(out[3],10);
            assert.equal(out[4],20);
            assert.equal(out[5],19);
            assert.equal(out[6],18);
            assert.equal(out[7],12);
            assert.equal(out[8],11);
            assert.equal(out[9],9);
            assert.equal(out[10],15);
            assert.equal(out[11],4);
            assert.equal(out[12],14);
            assert.equal(out[13],17);
            assert.equal(out[14],0);

           
        })
    });
});

contract("MatchingEngine Simulation", (accounts) => {

    //Tests Matching Engine and simulates trades

    this.matchingEngine = undefined;
    this.token1 = undefined;
    this.token2 = undefined;

    before(async () => {

        //Creating a token1 to use in the exchange
        this.token1 = await Testtoken1.deployed();
        this.token2 = await Testtoken2.deployed();

        //Creating a token for the matching engine
        this.matchingEngine = await MatchingEngine.deployed();

        //Distribute tokens amongst all user accounts - Token 1
        //account 0 already has tokens
        await this.token1.transfer(accounts[1],100);
        await this.token1.transfer(accounts[2],100);
        await this.token1.transfer(accounts[3],100);
        await this.token1.transfer(accounts[4],100);
        await this.token1.transfer(accounts[5],100);
        await this.token1.transfer(accounts[6],100);
        await this.token1.transfer(accounts[7],100);
        await this.token1.transfer(accounts[8],100);
        await this.token1.transfer(accounts[9],100);

        //Distribute tokens amongst all user accounts - Token 2
        //account 0 already has tokens
        await this.token2.transfer(accounts[1],100);
        await this.token2.transfer(accounts[2],100);
        await this.token2.transfer(accounts[3],100);
        await this.token2.transfer(accounts[4],100);
        await this.token2.transfer(accounts[5],100);
        await this.token2.transfer(accounts[6],100);
        await this.token2.transfer(accounts[7],100);
        await this.token2.transfer(accounts[8],100);
        await this.token2.transfer(accounts[9],100);

        //Approving the contracts usage by each of the account - Token 1
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[0]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[1]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[2]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[3]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[4]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[5]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[6]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[7]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[8]});
        await this.token1.approve(this.matchingEngine.address,100,{from: accounts[9]});

        //Approving the contracts usage by each of the account - Token 2
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[0]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[1]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[2]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[3]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[4]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[5]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[6]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[7]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[8]});
        await this.token2.approve(this.matchingEngine.address,100,{from: accounts[9]});

        //Depositing tokens into the exchange - Token 1
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[0]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[1]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[2]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[3]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[4]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[5]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[6]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[7]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[8]});
        await this.matchingEngine.depositToken(this.token1.address,100,{from: accounts[9]});

        //Depositing tokens into the exchange - Token 2
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[0]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[1]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[2]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[3]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[4]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[5]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[6]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[7]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[8]});
        await this.matchingEngine.depositToken(this.token2.address,100,{from: accounts[9]});
     
    })

    describe("Initial setup testing", () =>{

        it("all accounts have the correct balance and tokens", async () =>{
            let balancesToken1 = [];
            let balancesToken2 = [];

            for (let i = 0; i < 10; i++) {
                //Adding value to array
                balancesToken1.push(await this.matchingEngine.getBalance(this.token1.address,{from: accounts[i]}));
                balancesToken2.push(await this.matchingEngine.getBalance(this.token2.address,{from: accounts[i]}));
            }

            //Assertions
            for(let j = 0; j < 10; j++){
                assert.equal(balancesToken1[j],100,"Not correct balance for token 1");
                assert.equal(balancesToken2[j],100,"Not correct balance for token 2");
            }

        });

        it("matching engine is not currently active", async () =>{
            const value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,false, "The trading engine started out working and should be false");
        });

        it("matching engine registers after being turned on", async () =>{
            await this.matchingEngine.setEngineTrading(true);
            let value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,true,"Matching engine has not been turned on");
        });
    });

    describe("Testing insertion method", () =>{

        it("adding an order into the tree - Price 3 units", async () =>{
            await this.matchingEngine.makeOffer(30, this.token1.address, 10, this.token2.address, 0, {from: accounts[0]});
            const id = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.equal(id,1,"Order not_sell_token added into order book");
        });

        it("adding a higher priced order into the tree from a differnt account - Price 5 units", async () =>{
            await this.matchingEngine.makeOffer(10, this.token1.address, 2, this.token2.address, 0, {from: accounts[1]});
            const id = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.equal(id,1,"Order is to high to be first order");
        });

        it("adding a lower priced order into the tree from a differnt account - Price 1 units", async () =>{
            await this.matchingEngine.makeOffer(5, this.token1.address, 5, this.token2.address, 0, {from: accounts[2]});
            const id = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.equal(id,3,"Order is to high to be first order");
        });

        it("Inserting an offer and becoming the taker of current offers from a different account - Price 1 Units - Enough to take 2 orders from the book", async () =>{
            await this.matchingEngine.makeOffer(12, this.token2.address, 12, this.token1.address, 0, {from: accounts[3]});
            //const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            //console.log(out);


            /*const one =  await this.matchingEngine.getOrderDetails(1);
            const two = await this.matchingEngine.getOrderDetails(2);
            const three = await this.matchingEngine.getOrderDetails(3);
            const four = await this.matchingEngine.getOrderDetails(4);

            console.log(one);
            console.log(two);
            console.log(three);
            console.log(four);*/

            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            assert.equal(out,1);

            orderOutput = await this.matchingEngine.getOrderDetails(1);
            assert(orderOutput['id'] == 1,"id not equal to 3");
            assert(orderOutput['sell_amt'] == 23, "sell amount not equal to 23");
            assert(orderOutput['buy_amt'] == 8, "buy amount not equal to 2");
            assert(orderOutput['sell_token'] == this.token1.address, "token 1 address is not the same");
            assert(orderOutput['buy_token'] == this.token2.address, "token 2 address is not the same");
        });

        it("making sure there is no order for the order that has just been filled in the orderbook", async ()=>{
            const out = await this.matchingEngine.getFirstOffer(this.token2.address, this.token1.address);
            assert.equal(out,0);
        });

    });
});