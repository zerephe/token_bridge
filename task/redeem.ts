import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("redeem", "Redeem tokens")
  .addParam("from", "Sender")
  .addParam("to", "Recepient")
  .addParam("tokenAddr", "Token to be swaped")
  .addParam("amount", "Token amount")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const bridgeInstance = await hre.ethers.getContractAt("TokenBridge", contractAddress);

    const result = await bridgeInstance.swap(args.from, args.to, args.tokenAddr, args.amount);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };