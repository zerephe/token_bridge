import { ethers } from "hardhat";

async function main() {
 /* Deploying the contract */
  const [owner] = await ethers.getSigners()
  const TokenBridge = await ethers.getContractFactory("TokenBridge", owner);
  const bridgeInstance = await TokenBridge.deploy("0x91435C6775f12cb9ceeF6e10EA85fa617B425852", 97);
 
  await bridgeInstance.deployed();

  console.log("Deployed to:", bridgeInstance.address);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export default {
  solidity: "0.8.4"
};