import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("swap", "Swap tokens")
  .addParam("to", "Recepient")
  .addParam("tokenAddr", "Token to be swaped")
  .addParam("amount", "Token amount")
  .addParam("chainId", "Chain id of blockchain")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const bridgeInstance = await hre.ethers.getContractAt("TokenBridge", contractAddress);

    const result = await bridgeInstance.swap(args.to, args.tokenAddr, args.amount, args.chainId);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };