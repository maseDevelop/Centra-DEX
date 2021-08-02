const TestContract = artifacts.require("TestUnsignedConsumer");
const Decimal = require('decimal.js');
const BigNumber = require('bignumber.js');

//Testing librarys modules
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');


/**
 * This is more for me to gain an understand of how the prb-math
 * library works. 
 */
contract("TestContract", accounts => {

    this.TestContract = undefined

    before(async () => {
        this.TestContract = await TestContract.deployed();
    });

    describe('testing multiplication', () =>{

        it("muliplication of numbers less than one", async ()=>{
            //0.01 * 0.05 = 0.0005

            let out = await this.TestContract.unsignedMul(BigInt(10000000000000000n), BigInt(50000000000000000n));
            out = out/1e18;
            assert.equal(out,0.0005);
        });

        it("multiplication of number greater than one - Integers", async () =>{

            //2 * 6 = 12

            const two = 2 * 1e18;
            const six = 6 * 1e18;
            let out = await this.TestContract.unsignedMul(BigInt(two), BigInt(six));
            out = out/1e18;

            assert.equal(out,12);

        });


        it("multiplication of number greater than one - Integer and Decimals", async () =>{

            //2.5 * 300 = 750

            const first = 2.5 * 1e18;
            const second = 300 * 1e18;
            let out = await this.TestContract.unsignedMul(BigInt(first),BigInt(second));
            out = out/1e18;

            assert.equal(out,750);

        });

        it("multiplication of number greater than one - Decimal and Decimals with decimal output", async () =>{

            //2.688 * 2.33 = 6.26304

            const first = 2.688 * 1e18;
            const second = 2.33 * 1e18;
            let out = await this.TestContract.unsignedMul(BigInt(first),BigInt(second));
            out = out/1e18;

            assert.equal(out,6.26304);

        });
    });

    describe('testing division', () =>{

        it("Divide when numerator is zero", async ()=>{

             //0 / 5  = 0
             const first = 0;
             const second = 5 * 1e18;
             let out = await this.TestContract.unsignedMul(BigInt(first),BigInt(second));
             out = out/1e18;
             assert.equal(out,0);

        });

        it("Divide when denominator is zero", async ()=>{

             //5 / 0  = undefined - Should just be zero fromm the library
             const first = 5 * 1e18;
             const second = 0;
             let out = await this.TestContract.unsignedMul(BigInt(first),BigInt(second));
             out = out/1e18;
             assert.equal(out,0);

        });

        it("Divide when both numbers are decimal", async ()=>{
            
            //11111111111.5456 / 5.5 = 202020202020;

            //const first = 111.5456 * 1e18;
            //const second =5.5 * 1e18;

            //const first = new Decimal(12983.989).mul(1e18);
            //const second = new Decimal(782.99).mul(1e18);

            const first = new Decimal(1234567.88).mul(1e18);
            const second = new Decimal(782.99).mul(1e18);

            console.log(first);
            console.log(second);

            console.log("first: ", (first/second));
            console.log("second: ", 1234567.88/782.99);
            let out = await this.TestContract.unsignedMul(BigNumber(first),BigNumber(second));
            out = out/1e18;
            console.log(out);
            assert.equal(out,10166333.54711);

        });

        it("Divide when both numbers are Integer", async ()=>{

        });

        it("Divide when it is a clean divide", async ()=>{

        });

    });

});