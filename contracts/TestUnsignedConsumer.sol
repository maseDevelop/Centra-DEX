pragma solidity >=0.8.0;

import "prb-math/contracts/PRBMathUD60x18.sol";

/**
Modified Contract for Testing
Original Contract Found - https://github.com/hifi-finance/prb-math/tree/v1.0.3
 */

contract TestUnsignedConsumer {
  using PRBMathUD60x18 for uint256;

  /// @notice Calculates x*y÷1e18 while handling possible intermediary overflow.
  /// @dev Try this with x = type(uint256).max and y = 5e17.
  function unsignedMul(uint256 x, uint256 y) external pure returns (uint256 result) {
    result = PRBMathUD60x18.mul(x,y);
  }

  function unsignedDiv(uint256 x, uint256 y) external pure returns (uint256 result) {
    result = PRBMathUD60x18.div(x, y);
  }

}

