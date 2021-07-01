var Exchange = artifacts.require("../contracts/Exchange.sol");
var TestToken = artifacts.require("../contracts/TestToken.sol");

module.exports = function(deployer) {
 deployer.deploy(Exchange);
 deployer.deploy(TestToken,1000);
};