import { ethers } from "hardhat";

async function main() {
 /* Deploying the contract */
  const [owner] = await ethers.getSigners()
  const TokenBridge = await ethers.getContractFactory("TokenBridge", owner);
  const bridgeInstance = await TokenBridge.deploy("0x7a73017403F934f56DA85Cc5F9724eedf7a271bB", 4);
 
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