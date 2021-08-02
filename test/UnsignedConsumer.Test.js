const TestContract = artifacts.require("TestUnsignedConsumer");
const Decimal = require('decimal.js');

const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

contract("TestContract", accounts => {

    this.TestContract = undefined

    before(async () => {
        this.TestContract = await TestContract.deployed();
    });

    describe('testing multiplication', () =>{

        it("does it equal what I want, I wonder?", async ()=>{

            //const out = new Decimal(2.098.toString()).mul(1e18);

            //10000000000000000
            //1000000000000000000
            //50000000000000000
            //2098000000000000000
            //2098000000000000000

            //console.log(2098000000000000000 * 2098000000000000000);
            //console.log(2098000000000000000/1e18);
            //type(int256).max and y = 5e17.
            const out = await this.TestContract.unsignedMul(BigInt(20980000000000), BigInt(20980000000) );
            console.log(out.toNumber());

    

        });

        it("Testing normal function", async ()=>{

            //const out = await this.TestContract.unsignedMulTest(0.01, 0.05);
            console.log(5e17.toNumber());

        });

    });
});