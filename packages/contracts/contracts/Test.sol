// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

contract Test {
    function test(bytes calldata data) public view returns (bytes memory here) {
        console.log("ITS HERE", string(data));

        (address x, uint256 y, bool z) = decode(data);
        console.log("worked", x, y, z);
        return here;
    }

    function decode(bytes calldata data)
        public
        view
        returns (
            address x,
            uint256 y,
            bool z
        )
    {
        (x, y, z) = abi.decode(data, (address, uint256, bool));

        console.log("did it work", x, y, z);
        return (x, y, z);
    }
}
