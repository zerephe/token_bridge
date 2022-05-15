import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parse } from "path";

describe("Token bridge", function () {

  let tokenInstanceBsc: Contract;
  let tokenInstanceEth: Contract;
  let bridgeInstanceBsc: Contract;
  let bridgeInstanceEth: Contract;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function(){
    [owner, addr1] = await ethers.getSigners();

    const SwapTokenETH = await ethers.getContractFactory("SwapToken");
    tokenInstanceEth = await SwapTokenETH.deploy("SwapToken", "SWP");
    await tokenInstanceEth.deployed();

    const SwapTokenBSC = await ethers.getContractFactory("SwapToken");
    tokenInstanceBsc = await SwapTokenBSC.deploy("SwapToken", "SWP");
    await tokenInstanceBsc.deployed();

    const TokenBridgeEth = await ethers.getContractFactory("TokenBridge");
    bridgeInstanceEth = await TokenBridgeEth.deploy(tokenInstanceEth.address, 4);
    await bridgeInstanceEth.deployed();
    
    const TokenBridgeBsc = await ethers.getContractFactory("TokenBridge");
    bridgeInstanceBsc = await TokenBridgeBsc.deploy(tokenInstanceBsc.address, 97);
    await bridgeInstanceBsc.deployed();

    await bridgeInstanceEth.updateChainById(97);
    await bridgeInstanceBsc.updateChainById(4);

    await tokenInstanceEth.grantRole(tokenInstanceEth.MINTER_ROLE(), bridgeInstanceEth.address);
    await tokenInstanceBsc.grantRole(tokenInstanceEth.MINTER_ROLE(), bridgeInstanceBsc.address);

    await tokenInstanceEth.mint(owner.address, 1000);
    await tokenInstanceBsc.mint(owner.address, 1000);
  });

  describe("Deploy", function(){
    it("Should return proper token addresses on deploy", async function() {
      expect(bridgeInstanceBsc.address).to.be.properAddress;
      expect(bridgeInstanceEth.address).to.be.properAddress;
      expect(tokenInstanceBsc.address).to.be.properAddress;
      expect(tokenInstanceEth.address).to.be.properAddress;
    });

    it("Should support token", async function() {
      expect(await bridgeInstanceBsc.supportedToken(tokenInstanceBsc.address)).to.eq(tokenInstanceBsc.address);
      expect(await bridgeInstanceEth.supportedToken(tokenInstanceEth.address)).to.eq(tokenInstanceEth.address);
    });

    it("Should support blockchain", async function() {
      expect(await bridgeInstanceBsc.supportedChainId(4)).to.eq(true);
      expect(await bridgeInstanceEth.supportedChainId(97)).to.eq(true);
    });

    it("Should have token balace 1000 on both chains", async function() {
      expect(await tokenInstanceEth.balanceOf(owner.address)).to.eq(1000);
      expect(await tokenInstanceBsc.balanceOf(owner.address)).to.eq(1000);
    });
  });

  describe("Txs", function() {
    it("Should emit swap if succeed", async function() {
      await tokenInstanceEth.approve(bridgeInstanceEth.address, 100);
      expect(await bridgeInstanceEth.swap(addr1.address, tokenInstanceEth.address, 100, 97))
        .to.emit(bridgeInstanceEth, "swapInitialized")
        .withArgs(owner.address, addr1.address, tokenInstanceEth.address, 100, 0);
    });

    it("Should triger listener if swap event initialized", async function() {  
      bridgeInstanceEth.on("swapInitialized", async (from, to, tokenAddr, amount, nonce) => {
        const msg = ethers.utils.solidityKeccak256(
          ["address", "address", "uint256", "uint256"], 
          [from, tokenAddr, amount, nonce]
        );
        const signature = await owner.signMessage(ethers.utils.arrayify(msg));
        let sig = ethers.utils.splitSignature(signature);

        await bridgeInstanceBsc.redeem(from, to, tokenAddr, amount, nonce, sig.v, sig.r, sig.s);
        console.log("initialized");
      });

      await tokenInstanceEth.approve(bridgeInstanceEth.address, 100);
      await bridgeInstanceEth.swap(addr1.address, tokenInstanceEth.address, 100, 97);

      expect(await tokenInstanceBsc.balanceOf(addr1.address)).to.eq(100);
    });

    it("Should be added token support to be swapped", async function() {
      const SwapTokenETH = await ethers.getContractFactory("SwapToken");
      const newTokenInstanceEth = await SwapTokenETH.deploy("NewTokenInstance", "NTI");
      await newTokenInstanceEth.deployed();

      const SwapTokenBsc = await ethers.getContractFactory("SwapToken");
      const newTokenInstanceBsc = await SwapTokenBsc.deploy("NewTokenInstance", "NTI");
      await newTokenInstanceBsc.deployed();

      await bridgeInstanceEth.includeToken(newTokenInstanceEth.address);
      await bridgeInstanceBsc.includeToken(newTokenInstanceBsc.address);

      expect(await bridgeInstanceEth.supportedToken(newTokenInstanceEth.address)).to.eq(newTokenInstanceEth.address);
      expect(await bridgeInstanceBsc.supportedToken(newTokenInstanceBsc.address)).to.eq(newTokenInstanceBsc.address);
    });

    it("Should be deleted token support to be swapped", async function() {
      await bridgeInstanceEth.excludeToken(tokenInstanceEth.address);
      await bridgeInstanceBsc.excludeToken(tokenInstanceBsc.address);
      expect(await bridgeInstanceEth.supportedToken(tokenInstanceBsc.address)).to.eq("0x0000000000000000000000000000000000000000");
      expect(await bridgeInstanceBsc.supportedToken(tokenInstanceEth.address)).to.eq("0x0000000000000000000000000000000000000000");
    });

    it("Should add chain support", async function() {
      await bridgeInstanceEth.updateChainById(1);
      await bridgeInstanceBsc.updateChainById(2);
      expect(await bridgeInstanceEth.supportedChainId(1)).to.eq(true);
      expect(await bridgeInstanceBsc.supportedChainId(2)).to.eq(true);
    });

    it("Should delete chain support", async function() {
      await bridgeInstanceEth.updateChainById(97);
      await bridgeInstanceBsc.updateChainById(4);
      expect(await bridgeInstanceEth.supportedChainId(97)).to.eq(false);
      expect(await bridgeInstanceBsc.supportedChainId(4)).to.eq(false);
    });
  });
});