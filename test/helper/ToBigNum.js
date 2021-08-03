const Decimal = require('decimal.js');
const BigNumber = require('bignumber.js');

/**
 * 
 * @param number The number that you want to convert 
 * @returns a Fixed point big number
 */
const ToBigNum = (number) => {
    return new BigNumber(new Decimal(number) * 1e18);
}

exports.ToBigNum = ToBigNum;