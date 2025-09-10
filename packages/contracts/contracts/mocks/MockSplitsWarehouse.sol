/* solhint-disable one-contract-per-file */
// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.30;

import {
    IERC20Metadata as IERC20
} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {
    ShortString,
    ShortStrings
} from "@openzeppelin/contracts/utils/ShortStrings.sol";

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {
    SignatureChecker
} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IERC5267} from "@openzeppelin/contracts/interfaces/IERC5267.sol";

/**
 * @title Track user nonces.
 * @dev Inspired by Uniswap's Permit2 UnorderedNonces.
 */
abstract contract UnorderedNonces {
    /* -------------------------------------------------------------------------- */
    /*                                   ERRORS                                   */
    /* -------------------------------------------------------------------------- */

    error InvalidNonce();

    /* -------------------------------------------------------------------------- */
    /*                                   EVENTS                                   */
    /* -------------------------------------------------------------------------- */

    event NonceInvalidation(address indexed owner, uint256 indexed nonce);

    /* -------------------------------------------------------------------------- */
    /*                                   STORAGE                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Mapping of token owner to a specified word to a bitmap.
     * @dev word is capped at type(uint248).max.
     * @dev returns a uint256 bitmap.
     */
    mapping(address account => mapping(uint256 word => uint256 bitMap))
        public nonceBitMap;

    /* -------------------------------------------------------------------------- */
    /*                             EXTERNAL FUNCTIONS                             */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Invalidates the nonce for the msg.sender.
     * @dev if the nonce is already invalidated, the function will succeed.
     * @param _nonce nonce to invalidate.
     */
    function invalidateNonce(uint256 _nonce) external {
        (uint256 word, uint256 bit) = calculateWordAndBit(_nonce);

        // flip the bit in the bitmap by taking a bitwise OR.
        // if the bit is already flipped, the result will be the same.
        nonceBitMap[msg.sender][word] |= bit;

        emit NonceInvalidation(msg.sender, _nonce);
    }

    /**
     * @notice Check if a nonce can be used for a given address.
     * @param _from address to check.
     * @param _nonce nonce to check.
     * @return isValid returns true if the nonce is unused, false otherwise.
     */
    function isValidNonce(
        address _from,
        uint256 _nonce
    ) external view returns (bool) {
        (uint256 word, uint256 bit) = calculateWordAndBit(_nonce);

        return nonceBitMap[_from][word] & bit == 0;
    }

    /* -------------------------------------------------------------------------- */
    /*                             INTERNAL FUNCTIONS                             */
    /* -------------------------------------------------------------------------- */

    function useNonce(address _from, uint256 _nonce) internal {
        (uint256 word, uint256 bit) = calculateWordAndBit(_nonce);

        // flip the bit in the bitmap by taking a bitwise XOR.
        uint256 flipped = nonceBitMap[_from][word] ^= bit;

        // check if the bit was already flipped.
        if (flipped & bit == 0) revert InvalidNonce();

        emit NonceInvalidation(_from, _nonce);
    }

    function calculateWordAndBit(
        uint256 _nonce
    ) internal pure returns (uint256 word, uint256 bit) {
        // word is nonce divided by 256.
        word = uint256(_nonce) >> 8;

        // bit is 1 shifted left by the nonce modulo 256.
        /// forge-lint: disable-next-line(incorrect-shift)
        bit = 1 << uint8(_nonce);
    }
}

interface IERC165 {
    /// @notice Checks if a contract implements an interface.
    /// @param interfaceId The interface identifier, as specified in ERC-165.
    /// @return supported True if the contract implements `interfaceId` and
    /// `interfaceId` is not 0xffffffff, false otherwise.
    function supportsInterface(
        bytes4 interfaceId
    ) external view returns (bool supported);
}

/// @title ERC6909 Core Interface
/// @author jtriley.eth
interface IERC6909 is IERC165 {
    /// @notice The event emitted when a transfer occurs.
    /// @param caller The caller of the transfer.
    /// @param sender The address of the sender.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    event Transfer(
        address caller,
        address indexed sender,
        address indexed receiver,
        uint256 indexed id,
        uint256 amount
    );

    /// @notice The event emitted when an operator is set.
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @param approved The approval status.
    event OperatorSet(
        address indexed owner,
        address indexed spender,
        bool approved
    );

    /// @notice The event emitted when an approval occurs.
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 indexed id,
        uint256 amount
    );

    /// @notice Owner balance of an id.
    /// @param owner The address of the owner.
    /// @param id The id of the token.
    /// @return amount The balance of the token.
    function balanceOf(
        address owner,
        uint256 id
    ) external view returns (uint256 amount);

    /// @notice Spender allowance of an id.
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    /// @return amount The allowance of the token.
    function allowance(
        address owner,
        address spender,
        uint256 id
    ) external view returns (uint256 amount);

    /// @notice Checks if a spender is approved by an owner as an operator
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @return approved The approval status.
    function isOperator(
        address owner,
        address spender
    ) external view returns (bool approved);

    /// @notice Transfers an amount of an id from the caller to a receiver.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function transfer(
        address receiver,
        uint256 id,
        uint256 amount
    ) external returns (bool);

    /// @notice Transfers an amount of an id from a sender to a receiver.
    /// @param sender The address of the sender.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function transferFrom(
        address sender,
        address receiver,
        uint256 id,
        uint256 amount
    ) external returns (bool);

    /// @notice Approves an amount of an id to a spender.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function approve(
        address spender,
        uint256 id,
        uint256 amount
    ) external returns (bool);

    /// @notice Sets or removes a spender as an operator for the caller.
    /// @param spender The address of the spender.
    /// @param approved The approval status.
    function setOperator(
        address spender,
        bool approved
    ) external returns (bool);
}

interface IERC6909XCallback {
    function onTemporaryApprove(
        address owner,
        bool operator,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes4);
}

/**
 * @author https://github.com/frangio/erc6909-extensions
 */
interface IERC6909X is IERC5267 {
    function temporaryApproveAndCall(
        address spender,
        bool operator,
        uint256 id,
        uint256 amount,
        address target,
        bytes calldata data
    ) external returns (bool);

    function temporaryApproveAndCallBySig(
        address owner,
        address spender,
        bool operator,
        uint256 id,
        uint256 amount,
        address target,
        bytes calldata data,
        uint256 nonce,
        uint48 deadline,
        bytes calldata signature
    ) external returns (bool);

    function approveBySig(
        address owner,
        address spender,
        bool operator,
        uint256 id,
        uint256 amount,
        uint256 nonce,
        uint48 deadline,
        bytes calldata signature
    ) external returns (bool);
}

/// @notice Minimalist and gas efficient standard ERC6909 implementation.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC6909.sol)
abstract contract ERC6909 is IERC6909 {
    /* -------------------------------------------------------------------------- */
    /*                               ERC6909 STORAGE                              */
    /* -------------------------------------------------------------------------- */

    /// @inheritdoc IERC6909
    mapping(address owner => mapping(address operator => bool approved))
        public isOperator;

    /// @inheritdoc IERC6909
    mapping(address owner => mapping(uint256 id => uint256 amount))
        public balanceOf;

    /// @inheritdoc IERC6909
    mapping(address owner => mapping(address spender => mapping(uint256 tokenId => uint256 amount)))
        public allowance;

    /* -------------------------------------------------------------------------- */
    /*                                ERC6909 LOGIC                               */
    /* -------------------------------------------------------------------------- */

    /// @inheritdoc IERC6909
    function transfer(
        address _receiver,
        uint256 _id,
        uint256 _amount
    ) public virtual returns (bool) {
        balanceOf[msg.sender][_id] -= _amount;

        balanceOf[_receiver][_id] += _amount;

        emit Transfer({
            caller: msg.sender,
            sender: msg.sender,
            receiver: _receiver,
            id: _id,
            amount: _amount
        });

        return true;
    }

    /// @inheritdoc IERC6909
    function transferFrom(
        address _sender,
        address _receiver,
        uint256 _id,
        uint256 _amount
    ) public virtual returns (bool) {
        if (msg.sender != _sender && !isOperator[_sender][msg.sender]) {
            uint256 allowed = allowance[_sender][msg.sender][_id];
            if (allowed != type(uint256).max)
                allowance[_sender][msg.sender][_id] = allowed - _amount;
        }

        balanceOf[_sender][_id] -= _amount;

        balanceOf[_receiver][_id] += _amount;

        emit Transfer({
            caller: msg.sender,
            sender: _sender,
            receiver: _receiver,
            id: _id,
            amount: _amount
        });

        return true;
    }

    /// @inheritdoc IERC6909
    function approve(
        address _spender,
        uint256 _id,
        uint256 _amount
    ) public virtual returns (bool) {
        return
            _approve({
                _owner: msg.sender,
                _spender: _spender,
                _id: _id,
                _amount: _amount
            });
    }

    /// @inheritdoc IERC6909
    function setOperator(
        address _operator,
        bool _approved
    ) public virtual returns (bool) {
        return
            _setOperator({
                _owner: msg.sender,
                _operator: _operator,
                _approved: _approved
            });
    }

    /* -------------------------------------------------------------------------- */
    /*                                ERC165 LOGIC                                */
    /* -------------------------------------------------------------------------- */

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 _interfaceId
    ) public view virtual returns (bool) {
        return
            _interfaceId == type(IERC6909).interfaceId ||
            _interfaceId == type(IERC165).interfaceId;
    }

    /* -------------------------------------------------------------------------- */
    /*                          INTERNAL MINT/BURN LOGIC                          */
    /* -------------------------------------------------------------------------- */

    function _mint(
        address _receiver,
        uint256 _id,
        uint256 _amount
    ) internal virtual {
        balanceOf[_receiver][_id] += _amount;

        emit Transfer({
            caller: msg.sender,
            sender: address(0),
            receiver: _receiver,
            id: _id,
            amount: _amount
        });
    }

    function _burn(
        address _sender,
        uint256 _id,
        uint256 _amount
    ) internal virtual {
        balanceOf[_sender][_id] -= _amount;

        emit Transfer({
            caller: msg.sender,
            sender: _sender,
            receiver: address(0),
            id: _id,
            amount: _amount
        });
    }

    function _setOperator(
        address _owner,
        address _operator,
        bool _approved
    ) internal virtual returns (bool) {
        isOperator[_owner][_operator] = _approved;

        emit OperatorSet({
            owner: _owner,
            spender: _operator,
            approved: _approved
        });

        return true;
    }

    function _approve(
        address _owner,
        address _spender,
        uint256 _id,
        uint256 _amount
    ) internal virtual returns (bool) {
        allowance[_owner][_spender][_id] = _amount;

        emit Approval({
            owner: _owner,
            spender: _spender,
            id: _id,
            amount: _amount
        });

        return true;
    }
}

/**
 * @author forked from https://github.com/frangio/erc6909-extensions
 * @dev Implementation of the ERC-6909 Permit extension allowing approvals to spenders and operators to be made via
 * signatures.
 */
contract ERC6909X is ERC6909, EIP712, UnorderedNonces, IERC6909X {
    /* -------------------------------------------------------------------------- */
    /*                            CONSTANTS/IMMUTABLES                            */
    /* -------------------------------------------------------------------------- */

    /// @notice The EIP-712 typehash for approveAndCall
    bytes32 public constant APPROVE_AND_CALL_TYPE_HASH =
        keccak256(
            // solhint-disable-next-line max-line-length
            "ERC6909XApproveAndCall(bool temporary,address owner,address spender,bool operator,uint256 id,uint256 amount,address target,bytes data,uint256 nonce,uint48 deadline)"
        );

    /* -------------------------------------------------------------------------- */
    /*                                   ERRORS                                   */
    /* -------------------------------------------------------------------------- */

    error ExpiredSignature(uint48 deadline);
    error InvalidSigner();
    error InvalidPermitParams();
    error InvalidAck();

    /* -------------------------------------------------------------------------- */
    /*                                 CONSTRUCTOR                                */
    /* -------------------------------------------------------------------------- */

    /**
     * @dev Initializes the {EIP712} domain separator.
     *
     */
    constructor(
        string memory _name,
        string memory _version
    ) EIP712(_name, _version) {}

    /* -------------------------------------------------------------------------- */
    /*                              PUBLIC FUNCTIONS                              */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Returns true if `interfaceId` is supported.
     * @dev Supports ERC6909X, ERC165, and ERC6909.
     * @param _interfaceId The interface identifier, as specified in ERC-165.
     */
    function supportsInterface(
        bytes4 _interfaceId
    ) public view override returns (bool supported) {
        return
            super.supportsInterface({_interfaceId: _interfaceId}) ||
            _interfaceId == type(IERC6909X).interfaceId;
    }

    /**
     * @notice Temporary grants spender allowance or operator status and forwards the data to the target contract.
     * @dev The function will revert if the target contract does not return the expected ack.
     * @param _spender The address of the account that will be allowed to spend the tokens.
     * @param _operator True if the spender is to be set as an operator. if True, id and amount should be 0.
     * @param _id The ID of the token to be spent.
     * @param _amount The amount of the token to be spent.
     * @param _target The address of the contract to be called.
     * @param _data The data to be sent to the target contract.
     * @return True Returns true if the call is successful.
     */
    function temporaryApproveAndCall(
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        address _target,
        bytes memory _data
    ) external returns (bool) {
        _temporaryApproveAndCall({
            _owner: msg.sender,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount,
            _target: _target,
            _data: _data
        });
        return true;
    }

    /**
     * @notice Temporary grants spender allowance or operator status and forwards the data to the target contract using
     * a signature.
     * @dev The function will revert if the signature is invalid or the target contract does not return the expected
     * ack.
     * @param _owner The address of the account that will be allowing the spender to spend the tokens.
     * @param _spender The address of the account that will be allowed to spend the tokens.
     * @param _operator True if the spender is to be set as an operator. if True, id and amount should be 0.
     * @param _id The ID of the token to be spent.
     * @param _amount The amount of the token to be spent.
     * @param _target The address of the contract to be called.
     * @param _data The data to be sent to the target contract.
     * @param _nonce Unused nonce.
     * @param _deadline The deadline timestamp for the signature.
     * @param _signature The signature to be validated.
     * @return True Returns true if the call is successful.
     */
    function temporaryApproveAndCallBySig(
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        address _target,
        bytes memory _data,
        uint256 _nonce,
        uint48 _deadline,
        bytes memory _signature
    ) external returns (bool) {
        // if the nonce is invalid, the function will revert.
        useNonce({_from: _owner, _nonce: _nonce});

        _validateApproveAndCallSignature({
            _temporary: true,
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount,
            _target: _target,
            _data: _data,
            _nonce: _nonce,
            _deadline: _deadline,
            _signature: _signature
        });

        _temporaryApproveAndCall({
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount,
            _target: _target,
            _data: _data
        });

        return true;
    }

    /**
     * @notice Grants spender allowance or operator status using a signature.
     * @dev The function will revert if the signature is invalid.
     * @param _owner The address of the account that will be allowing the spender to spend the tokens.
     * @param _spender The address of the account that will be allowed to spend the tokens.
     * @param _operator True if the spender is to be set as an operator. if True, id and amount should be 0.
     * @param _id The ID of the token to be spent.
     * @param _amount The amount of the token to be spent.
     * @param _nonce Unused nonce.
     * @param _deadline The deadline timestamp for the signature.
     * @param _signature The signature to be validated.
     * @return True returns true if the call is successful.
     */
    function approveBySig(
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        uint256 _nonce,
        uint48 _deadline,
        bytes memory _signature
    ) external returns (bool) {
        // if the nonce is invalid, the function will revert.
        useNonce({_from: _owner, _nonce: _nonce});

        _validateApproveAndCallSignature({
            _temporary: false,
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount,
            _target: address(0),
            _data: "",
            _nonce: _nonce,
            _deadline: _deadline,
            _signature: _signature
        });

        _setSpenderAccess({
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount
        });

        return true;
    }

    /* -------------------------------------------------------------------------- */
    /*                             INTERNAL FUNCTIONS                             */
    /* -------------------------------------------------------------------------- */

    function _temporaryApproveAndCall(
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        address _target,
        bytes memory _data
    ) internal {
        (bool prevIsOperator, uint256 prevAllowance) = _setSpenderAccess({
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount
        });

        bytes4 ack = IERC6909XCallback(_target).onTemporaryApprove({
            owner: _owner,
            operator: _operator,
            id: _id,
            amount: _amount,
            data: _data
        });
        if (ack != IERC6909XCallback.onTemporaryApprove.selector)
            revert InvalidAck();

        if (_operator) {
            _setOperator({
                _owner: _owner,
                _operator: _spender,
                _approved: prevIsOperator
            });
        } else {
            _approve({
                _owner: _owner,
                _spender: _spender,
                _id: _id,
                _amount: prevAllowance
            });
        }
    }

    function _setSpenderAccess(
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount
    ) internal returns (bool prevIsOperator, uint256 prevAllowance) {
        if (_operator) {
            if (_id != 0 || _amount != 0) revert InvalidPermitParams();
            prevIsOperator = isOperator[_owner][_spender];

            _setOperator({
                _owner: _owner,
                _operator: _spender,
                _approved: true
            });
        } else {
            prevAllowance = allowance[_owner][_spender][_id];

            _approve({
                _owner: _owner,
                _spender: _spender,
                _id: _id,
                _amount: _amount
            });
        }
    }

    function _validateApproveAndCallSignature(
        bool _temporary,
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        address _target,
        bytes memory _data,
        uint256 _nonce,
        uint48 _deadline,
        bytes memory _signature
    ) internal view {
        if (block.timestamp > _deadline) revert ExpiredSignature(_deadline);

        bytes32 messageHash = _hashApproveAndCallMessage({
            _temporary: _temporary,
            _owner: _owner,
            _spender: _spender,
            _operator: _operator,
            _id: _id,
            _amount: _amount,
            _target: _target,
            _data: _data,
            _nonce: _nonce,
            _deadline: _deadline
        });

        if (
            !SignatureChecker.isValidSignatureNow({
                signer: _owner,
                hash: messageHash,
                signature: _signature
            })
        ) {
            revert InvalidSigner();
        }
    }

    function _hashApproveAndCallMessage(
        bool _temporary,
        address _owner,
        address _spender,
        bool _operator,
        uint256 _id,
        uint256 _amount,
        address _target,
        bytes memory _data,
        uint256 _nonce,
        uint48 _deadline
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4({
                structHash: keccak256(
                    abi.encode(
                        APPROVE_AND_CALL_TYPE_HASH,
                        _temporary,
                        _owner,
                        _spender,
                        _operator,
                        _id,
                        _amount,
                        _target,
                        keccak256(_data),
                        _nonce,
                        _deadline
                    )
                )
            });
    }

    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }
}

library Cast {
    error Overflow();

    function toAddress(uint256 _value) internal pure returns (address) {
        return address(toUint160(_value));
    }

    function toUint256(address _value) internal pure returns (uint256) {
        return uint256(uint160(_value));
    }

    function toUint160(uint256 _x) internal pure returns (uint160 y) {
        if (_x >> 160 != 0) revert Overflow();
        // solhint-disable-next-line no-inline-assembly
        assembly {
            y := _x
        }
    }
}

/**
 * @title Splits Token Warehouse
 * @author Splits
 * @notice ERC6909 compliant token warehouse for Splits ecosystem
 * @dev Token id here is uint256(uint160(address tokenAddress)).
 */
contract MockSplitsWarehouse is ERC6909X {
    using Cast for uint256;
    using Cast for address;
    using SafeERC20 for IERC20;
    using Address for address payable;
    using ShortStrings for string;
    using ShortStrings for ShortString;

    /* -------------------------------------------------------------------------- */
    /*                                   ERRORS                                   */
    /* -------------------------------------------------------------------------- */

    error InvalidAmount();
    error LengthMismatch();
    error WithdrawalPaused(address owner);

    /* -------------------------------------------------------------------------- */
    /*                                   EVENTS                                   */
    /* -------------------------------------------------------------------------- */

    event WithdrawConfigUpdated(address indexed owner, WithdrawConfig config);
    event Withdraw(
        address indexed owner,
        address indexed token,
        address indexed withdrawer,
        uint256 amount,
        uint256 reward
    );

    /* -------------------------------------------------------------------------- */
    /*                                   STRUCTS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Withdraw config for a user.
     * @param incentive The incentive for withdrawing tokens.
     * @param paused The paused state of the withdrawal.
     */
    struct WithdrawConfig {
        uint16 incentive;
        bool paused;
    }

    /* -------------------------------------------------------------------------- */
    /*                            CONSTANTS/IMMUTABLES                            */
    /* -------------------------------------------------------------------------- */

    /// @notice prefix for metadata name.
    string private constant METADATA_PREFIX_NAME = "Splits Wrapped ";

    /// @notice prefix for metadata symbol.
    string private constant METADATA_PREFIX_SYMBOL = "splits";

    /// @notice address of the native token, inline with ERC 7528.
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @notice uint256 representation of the native token.
    uint256 public constant NATIVE_TOKEN_ID = uint256(uint160(NATIVE_TOKEN));

    /// @notice metadata name of the native token.
    ShortString private immutable NATIVE_TOKEN_NAME;

    /// @notice metadata symbol of the native token.
    ShortString private immutable NATIVE_TOKEN_SYMBOL;

    /// @notice Scale for any numbers representing percentages.
    /// @dev Used for the token withdrawing incentive.
    uint256 public constant PERCENTAGE_SCALE = 1e6;

    /* -------------------------------------------------------------------------- */
    /*                                   STORAGE                                  */
    /* -------------------------------------------------------------------------- */

    /// @notice Withdraw config of a user.
    mapping(address owner => WithdrawConfig config) public withdrawConfig;

    /* -------------------------------------------------------------------------- */
    /*                                 CONSTRUCTOR                                */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Constructs the SplitsWarehouse contract.
     * @param _native_token_name The name of the native token.
     * @param _native_token_symbol The symbol of the native token.
     */
    constructor(
        string memory _native_token_name,
        string memory _native_token_symbol
    ) ERC6909X("SplitsWarehouse", "v1") {
        NATIVE_TOKEN_NAME = _native_token_name.toShortString();
        NATIVE_TOKEN_SYMBOL = _native_token_symbol.toShortString();
    }

    /* -------------------------------------------------------------------------- */
    /*                               ERC6909METADATA                              */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Name of a given token.
     * @param id The id of the token.
     * @return The name of the token.
     */
    function name(uint256 id) external view returns (string memory) {
        if (id == NATIVE_TOKEN_ID) {
            return NATIVE_TOKEN_NAME.toString();
        }
        return
            string.concat(METADATA_PREFIX_NAME, IERC20(id.toAddress()).name());
    }

    /**
     * @notice Symbol of a given token.
     * @param id The id of the token.
     * @return The symbol of the token.
     */
    function symbol(uint256 id) external view returns (string memory) {
        if (id == NATIVE_TOKEN_ID) {
            return NATIVE_TOKEN_SYMBOL.toString();
        }
        return
            string.concat(
                METADATA_PREFIX_SYMBOL,
                IERC20(id.toAddress()).symbol()
            );
    }

    /**
     * @notice Decimals of a given token.
     * @param id The id of the token.
     * @return The decimals of the token.
     */
    function decimals(uint256 id) external view returns (uint8) {
        if (id == NATIVE_TOKEN_ID) {
            return 18;
        }
        return IERC20(id.toAddress()).decimals();
    }

    /* -------------------------------------------------------------------------- */
    /*                          PUBLIC/EXTERNAL FUNCTIONS                         */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Deposits token to the warehouse for a specified address.
     * @dev If the token is native, the amount should be sent as value.
     * @param _receiver The address that will receive the wrapped tokens.
     * @param _token The address of the token to be deposited.
     * @param _amount The amount of the token to be deposited.
     */
    function deposit(
        address _receiver,
        address _token,
        uint256 _amount
    ) external payable {
        if (_token == NATIVE_TOKEN) {
            if (_amount != msg.value) revert InvalidAmount();
        } else {
            IERC20(_token).safeTransferFrom({
                from: msg.sender,
                to: address(this),
                value: _amount
            });
        }

        _mint({
            _receiver: _receiver,
            _id: _token.toUint256(),
            _amount: _amount
        });
    }

    /**
     * @notice Batch deposits token to the warehouse for the specified addresses from msg.sender.
     * @dev If the token is native, the amount should be sent as value.
     * @param _token The address of the token to be deposited.
     * @param _receivers The addresses that will receive the wrapped tokens.
     * @param _amounts The amounts of the token to be deposited.
     */
    function batchDeposit(
        address[] calldata _receivers,
        address _token,
        uint256[] calldata _amounts
    ) external payable {
        if (_receivers.length != _amounts.length) revert LengthMismatch();

        uint256 sum;
        uint256 amount;
        uint256 tokenId = _token.toUint256();
        uint256 length = _receivers.length;

        for (uint256 i; i < length; ++i) {
            amount = _amounts[i];
            sum += amount;
            _mint({_receiver: _receivers[i], _id: tokenId, _amount: amount});
        }

        if (_token == NATIVE_TOKEN) {
            if (sum != msg.value) revert InvalidAmount();
        } else {
            IERC20(_token).safeTransferFrom({
                from: msg.sender,
                to: address(this),
                value: sum
            });
        }
    }

    /**
     * @notice Withdraws token from the warehouse for _owner.
     * @dev Bypasses withdrawal incentives.
     * @param _owner The address whose tokens are withdrawn.
     * @param _token The address of the token to be withdrawn.
     */
    function withdraw(address _owner, address _token) external {
        // solhint-disable-next-line avoid-tx-origin
        if (msg.sender != _owner && tx.origin != _owner) {
            if (withdrawConfig[_owner].paused) {
                revert WithdrawalPaused(_owner);
            }
        }

        // leave 1 to save gas.
        uint256 amount = balanceOf[_owner][_token.toUint256()] - 1;

        _withdraw({
            _owner: _owner,
            _token: _token,
            _amount: amount,
            _withdrawer: msg.sender,
            _reward: 0
        });
    }

    /**
     * @notice Withdraws tokens from the warehouse for a specified address.
     * @dev It is recommended to withdraw balance - 1 to save gas.
     * @param _owner The address whose tokens are withdrawn.
     * @param _tokens The addresses of the tokens to be withdrawn.
     * @param _amounts The amounts of the tokens to be withdrawn.
     * @param _withdrawer The address that will receive the withdrawer incentive.
     */
    function withdraw(
        address _owner,
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        address _withdrawer
    ) external {
        if (_tokens.length != _amounts.length) revert LengthMismatch();

        WithdrawConfig memory config = withdrawConfig[_owner];

        if (config.paused) revert WithdrawalPaused(_owner);

        uint256 reward;
        uint256 length = _tokens.length;

        for (uint256 i; i < length; ++i) {
            reward = (_amounts[i] * config.incentive) / PERCENTAGE_SCALE;

            _withdraw({
                _owner: _owner,
                _token: _tokens[i],
                _amount: _amounts[i],
                _withdrawer: _withdrawer,
                _reward: reward
            });
        }
    }

    /**
     * @notice Batch transfers tokens to the specified addresses from msg.sender.
     * @param _receivers The addresses of the receivers.
     * @param _token The address of the token to be transferred.
     * @param _amounts The amounts of the tokens to be transferred.
     */
    function batchTransfer(
        address[] calldata _receivers,
        address _token,
        uint256[] calldata _amounts
    ) external {
        if (_receivers.length != _amounts.length) revert LengthMismatch();

        uint256 sum;
        uint256 amount;
        address receiver;

        uint256 tokenId = _token.toUint256();
        uint256 length = _receivers.length;

        for (uint256 i; i < length; ++i) {
            receiver = _receivers[i];
            amount = _amounts[i];

            balanceOf[receiver][tokenId] += amount;
            emit Transfer({
                caller: msg.sender,
                sender: msg.sender,
                receiver: receiver,
                id: tokenId,
                amount: amount
            });

            sum += amount;
        }

        balanceOf[msg.sender][tokenId] -= sum;
    }

    /**
     * @notice Sets the withdraw config for the msg.sender.
     * @param _config Includes the incentives for withdrawal and their paused state.
     */
    function setWithdrawConfig(WithdrawConfig calldata _config) external {
        withdrawConfig[msg.sender] = _config;
        emit WithdrawConfigUpdated({owner: msg.sender, config: _config});
    }

    /* -------------------------------------------------------------------------- */
    /*                              INTERNAL/PRIVATE                              */
    /* -------------------------------------------------------------------------- */

    function _withdraw(
        address _owner,
        address _token,
        uint256 _amount,
        address _withdrawer,
        uint256 _reward
    ) internal {
        _burn({_sender: _owner, _id: _token.toUint256(), _amount: _amount});

        uint256 amountToOwner = _amount - _reward;

        if (_token == NATIVE_TOKEN) {
            payable(_owner).sendValue(amountToOwner);

            if (_reward != 0) payable(_withdrawer).sendValue(_reward);
        } else {
            IERC20(_token).safeTransfer({to: _owner, value: amountToOwner});

            if (_reward != 0)
                IERC20(_token).safeTransfer({to: _withdrawer, value: _reward});
        }

        // solhint-disable-next-line
        emit Withdraw({
            owner: _owner,
            token: _token,
            withdrawer: _withdrawer,
            amount: amountToOwner,
            reward: _reward
        });
    }
}
