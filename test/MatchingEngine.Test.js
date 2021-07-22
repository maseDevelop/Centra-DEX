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
     
    })

    describe("Initial setup testing", () =>{
        it("matching engine is not currently active", async () =>{
            const value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,false, "The trading engine started out working and should be false");
        });

        it("matching engine registers after being turned on", async () =>{
            await this.matchingEngine.setEngineTrading(true);
            let value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,true,"Matching engine has not been turned on");
            await this.matchingEngine.setEngineTrading(false);//Turn of for testing to add orders
            value = await this.matchingEngine.EngineTrading();
            assert.strictEqual(value,false,"Matching Engine did not turn off");
        });
    });

    describe("Testing insertion method", () =>{

        
    
    });

    /*describe("Testing insertion method", () =>{

        it("making sure that there are no orders active", async () =>{
            const out = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address)
            assert(out,0,"The orders are not intialised to zero");
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
            const out = await this.matchingEngine.getLastOffer(this.token1.address, this.token2.address);
            const out1 = await this.matchingEngine.getFirstOffer(this.token1.address, this.token2.address);
            //Should still be the same ID
            assert.strictEqual(out.toNumber(),3, "Wrong ID is outputed for highest price ID");
            assert.strictEqual(out1.toNumber(),2, "Wrong ID is outputed for lowest price ID");
        });

    });

    describe("Testing Getting a specific order", async () =>{

        it("Get the right price from a specified order", async () =>{



            const price1 = await this.matchingEngine.getNode(3,this.token1.address, this.token2.address);
            assert.equal(price1.toNumber(),6,"Wrong price returned");

            const price2 = await this.matchingEngine.getNode(2,this.token1.address, this.token2.address);
            assert.equal(price2.toNumber(),4,"Wrong price returned");

            const price3 = await this.matchingEngine.getNode(1,this.token1.address, this.token2.address);
            assert.equal(price3.toNumber(),5,"Wrong price returned");
        });

    });*/

});