var Exchange = artifacts.require("../contracts/Exchange.sol");
var MatchingEngine = artifacts.require("../contracts/MatchingEngine.sol");
var Testtoken1 = artifacts.require("../contracts/Testtoken1.sol");
var Testtoken2 = artifacts.require("../contracts/Testtoken2.sol");

module.exports = function(deployer) {
 deployer.deploy(Exchange);
 
 //Deploying Matching Engine and Test Tokens for unit testing
 deployer.deploy(Testtoken1,1000);
 deployer.deploy(Testtoken2,1000);
 deployer.deploy(MatchingEngine);
};