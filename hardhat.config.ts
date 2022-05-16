import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "solidity-coverage";

import "./task/redeem.ts"
import "./task/swap.ts"

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // forking: {
      //   url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.MAINNET_API}`,
      //   blockNumber: 12851100,
      // },
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    rinkeby: {
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      url: process.env.ALCHEMY_URL,
      chainId: 4,
    },
    bscTestnet: {
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      url: process.env.BSCRPC_API,
      chainId: 97,
    }
  },
  etherscan: {
    // apiKey: process.env.ETHERSCAN_API,
    apiKey: process.env.BSCSCAN_API,
  },
};

export default config;
