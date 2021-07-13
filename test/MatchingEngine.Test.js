const MatchingEngine = artifacts.require("MatchingEngine");
const Testtoken1 = artifacts.require("Testtoken1");

const { assert } = require('chai');
//Truffle asserts 
const truffleAssert = require('truffle-assertions');

contract("MatchingEngine", (accounts) => {

    this.matchingEngine = undefined;

    describe("Initial setup testing", () =>{

        it("matching engine is not currently active", async () =>{
            /*this.matchingEngine = await MatchingEngine.deployed();
            const value = await this.matchingEngine.EngineTrading;
            console.log(value);
            assert(value,false);*/
        });
        
    });

});