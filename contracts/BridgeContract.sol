//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./ISwapToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenBridge is Ownable {
    event swapInitialized(address from, address to, address tokenAddr, uint256 amount, uint256 nonce);

    uint256 public chainId;
    uint256 private nonce = 0;

    address private nullAddress = 0x0000000000000000000000000000000000000000;

    mapping(address => mapping(uint256 => bool)) private isNonced;
    mapping(uint256 => bool) public supportedChainId;
    mapping(uint256 => bytes32) private processedSignature;
    mapping(address => ISwapToken) public supportedToken;

    constructor(address _erc20, uint _chainId) {
        supportedToken[_erc20] = ISwapToken(_erc20);
        chainId = _chainId;
    }

    function updateChainById(uint256 id) external onlyOwner returns(bool){
        if(supportedChainId[id]) supportedChainId[id] = false;
        else supportedChainId[id] = true;
        
        return true;
    }

    function swap(address to, address tokenAddr, uint256 amount, uint256 _chainId) external returns(bool){
        require(address(supportedToken[tokenAddr]) != nullAddress, "Token not supported!");
        require(supportedChainId[_chainId], "Blockchain doesnt supported");
        require(!isNonced[msg.sender][nonce], "Swap was already processed!");

        isNonced[msg.sender][nonce] = true;
        supportedToken[tokenAddr].burnFrom(msg.sender, amount);

        emit swapInitialized(msg.sender, to, tokenAddr, amount, nonce);
        
        nonce++;

        return true;
    }

    function redeem(
            address from, 
            address to, 
            address tokenAddr, 
            uint256 amount, 
            uint256 _nonce,
            uint8 v, bytes32 r, bytes32 s
        ) public returns (bool){
        require(address(supportedToken[tokenAddr]) != nullAddress, "Token not supported!");
        bytes32 message = keccak256(abi.encodePacked(from, tokenAddr, amount, nonce));
        bytes32 hashedMessage = hashMessage(message);
        address addr = ecrecover(hashedMessage, v, r, s);

        require(processedSignature[_nonce] != hashedMessage, "Redeem was already processed!");
        require(addr == from, "Invalid transaction!");

        processedSignature[_nonce] = hashedMessage;
        supportedToken[tokenAddr].mint(to, amount);

        return true;
    }

    function hashMessage(bytes32 message) private pure returns (bytes32) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        return keccak256(abi.encodePacked(prefix, message));
    }

    function includeToken(address tokenAddr) external onlyOwner returns(bool){
        supportedToken[tokenAddr] = ISwapToken(tokenAddr);
        return true;
    }

    function excludeToken(address tokenAddr) external onlyOwner returns(bool){
        supportedToken[tokenAddr] = ISwapToken(nullAddress);
        return true;
    }

}