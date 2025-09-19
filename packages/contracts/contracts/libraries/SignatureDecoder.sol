// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SignatureDecoder
 * @notice Decodes signatures that are encoded as bytes
 */
library SignatureDecoder {
    error InvalidSignaturesLength();

    /**
     * @dev Recovers address who signed the message
     * @param _hash bytes32 - keccak256 hash of message
     * @param _signatures bytes - concatenated message signatures
     * @param _pos uint256 - which signature to read
     * @return address - recovered address
     */
    function recoverKey(
        bytes32 _hash,
        bytes calldata _signatures,
        uint256 _pos
    ) internal pure returns (address) {
        // Check that the provided signature data is not too short
        if (_signatures.length < _pos * 65) {
            revert InvalidSignaturesLength();
        }

        (uint8 v, bytes32 r, bytes32 s) = _signatureSplit(_signatures, _pos);
        address signer = ECDSA.recover(_hash, v, r, s);
        return signer;
    }

    /**
     * @dev Divides bytes signature into `uint8 v, bytes32 r, bytes32 s`.
     * @dev Make sure to perform a bounds check for @param pos, to avoid out of bounds access on @param signatures
     * @param _pos which signature to read. A prior bounds check of this parameter should be performed, to avoid out of bounds access
     * @param _signatures concatenated rsv signatures
     */
    function _signatureSplit(
        bytes memory _signatures,
        uint256 _pos
    ) private pure returns (uint8 v, bytes32 r, bytes32 s) {
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let signaturePos := mul(0x41, _pos)
            r := mload(add(_signatures, add(signaturePos, 0x20)))
            s := mload(add(_signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(_signatures, add(signaturePos, 0x60))))
        }
    }
}
