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

    mapping(address => mapping(uint256 => bool)) private isNonced;
    mapping(uint256 => bool) public supportedChainId;
    mapping(uint256 => bytes32) private processedSignature;
    mapping(address => ISwapToken) public supportedToken;

    /*
     * Constructor - creates supported token and applies chainId
     * @param {address} erc20 - Address of token
     * @param {uint256} hainId - ChainId where contract is working
     */
    constructor(address _erc20, uint256 _chainId) {
        supportedToken[_erc20] = ISwapToken(_erc20);
        chainId = _chainId;
    }
    
    /**
     * Adds or removes blockchain support by id
     * @param {id} id - Chain id 
     * @return {bool} - Returns true if transaction succeed
     */
    function updateChainById(uint256 id) external onlyOwner returns(bool){
        if(supportedChainId[id]) supportedChainId[id] = false;
        else supportedChainId[id] = true;
        
        return true;
    }

    /**
     * Sends swap transaction of token between to blockchains
     * @param {address} to - Address of recipient
     * @param {address} tokenAddr - Token address, that should be transfered
     * @param {uint256} amount - Token amount
     * @param {uint256} _chainId - ChainId of blockchain where tokens should be transfered
     * @return {bool} - Returns true if transaction succeed
     */
    function swap(address to, address tokenAddr, uint256 amount, uint256 _chainId) external returns(bool){
        require(address(supportedToken[tokenAddr]) != address(0), "Token not supported!");
        require(supportedChainId[_chainId], "Blockchain doesnt supported");
        require(!isNonced[msg.sender][nonce], "Swap was already processed!");

        isNonced[msg.sender][nonce] = true;
        supportedToken[tokenAddr].burnFrom(msg.sender, amount);

        emit swapInitialized(msg.sender, to, tokenAddr, amount, nonce);
        
        nonce++;

        return true;
    }

    /**
     * Signs a message, if signature is valid, mints tokens to recipient
     * @param {address} from - Address of token sender
     * @param {address} to - Address of recipient
     * @param {address} tokenAddr - Token address, that should be transfered
     * @param {uint256} amount - Token amount
     * @param {uint256} _nonce - Uniq nonce number 
     * @param {uint8} v - v part of signature
     * @param {bytes32} r - r part of signature
     * @param {bytes32} s - s part of signature 
     * @return {bool} - Returns true if transaction succeed
     */
    function redeem(
            address from, 
            address to, 
            address tokenAddr, 
            uint256 amount, 
            uint256 _nonce,
            uint8 v, bytes32 r, bytes32 s
        ) public returns (bool){
        require(address(supportedToken[tokenAddr]) != address(0), "Token not supported!");
        bytes32 message = keccak256(abi.encodePacked(from, tokenAddr, amount, nonce));
        bytes32 hashedMessage = hashMessage(message);
        address addr = ecrecover(hashedMessage, v, r, s);

        require(processedSignature[_nonce] != hashedMessage, "Redeem was already processed!");
        require(addr == from, "Invalid transaction!");

        processedSignature[_nonce] = hashedMessage;
        supportedToken[tokenAddr].mint(to, amount);

        return true;
    }

    /**
     * Concatenates prefix and message
     * @param {bytes32} message - Message that includes swap data
     * @return {bytes32} - Returns prefixed and hashed message
     */
    function hashMessage(bytes32 message) private pure returns (bytes32) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        return keccak256(abi.encodePacked(prefix, message));
    }

    /**
     * Adds token support for swap
     * @param {address} tokenAddr - Address of token that should be added
     * @return {bool} - Returns true if transaction succeed
     */
    function includeToken(address tokenAddr) external onlyOwner returns(bool){
        supportedToken[tokenAddr] = ISwapToken(tokenAddr);
        return true;
    }

    /**
     * Deletes token support for swap
     * @param {address} tokenAddr - Address of token that should be excluded
     * @return {bool} - Returns true if transaction succeed
     */
    function excludeToken(address tokenAddr) external onlyOwner returns(bool){
        supportedToken[tokenAddr] = ISwapToken(address(0));
        return true;
    }

}