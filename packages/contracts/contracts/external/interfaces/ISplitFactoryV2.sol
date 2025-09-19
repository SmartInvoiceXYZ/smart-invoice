// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.30;

import {SplitV2Lib} from "../libraries/SplitV2Lib.sol";

/**
 * @title ISplitFactoryV2
 * @notice Interface for SplitFactoryV2 for creating a new push or pull split.
 */
interface ISplitFactoryV2 {
    /**
     * @notice Create a new split with params and owner.
     * @dev Uses a hash-based incrementing nonce over params and owner.
     * @dev designed to be used with integrating contracts to avoid salt management and needing to handle the potential
     * for griefing via front-running. See docs for more information.
     * @param _splitParams Params to create split with.
     * @param _owner Owner of created split.
     * @param _creator Creator of created split.
     */
    function createSplit(
        SplitV2Lib.Split calldata _splitParams,
        address _owner,
        address _creator
    ) external returns (address split);
}
