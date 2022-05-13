import { ethers } from "hardhat";

async function main() {
 /* Deploying the contract */
  const [owner] = await ethers.getSigners()
  const SwapToken = await ethers.getContractFactory("SwapToken", owner);
  const tokenInstance = await SwapToken.deploy("SwapToken", "SWP");
 
  await tokenInstance.deployed();

  console.log("Deployed to:", tokenInstance.address);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export default {
  solidity: "0.8.4"
};