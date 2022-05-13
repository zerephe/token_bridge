// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwapToken {
    function mint(address to, uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;
}