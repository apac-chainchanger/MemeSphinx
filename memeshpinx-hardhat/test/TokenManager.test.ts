import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TestToken, TokenManager } from "../typechain-types";

describe("TokenManager", () => {
  let owner: HardhatEthersSigner;
  let managerWallet: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let tokenManager: TokenManager;
  let testTokens: TestToken[] = [];

  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  before(async () => {
    [owner, managerWallet, user] = await ethers.getSigners();

    // Deploy 3 test tokens
    const TestTokenFactory = await ethers.getContractFactory("TestToken");
    for (let i = 0; i < 6; i++) {
      const token = await TestTokenFactory.deploy(
        `Test Token ${i}`,
        `TT${i}`,
        18,
        INITIAL_SUPPLY
      );
      await token.waitForDeployment();
      testTokens.push(token as unknown as TestToken);
    }

    console.log(`Number of test tokens: ${testTokens.length}`);
    for (const token of testTokens) {
      console.log(await token.getAddress());
    }

    // Deploy TokenManager
    const TokenManagerFactory = await ethers.getContractFactory("TokenManager");
    tokenManager = (await TokenManagerFactory.deploy(
      managerWallet.address,
      await Promise.all(
        testTokens.map(async (token) => {
          const address = await token.getAddress();
          console.log(address);
          return address;
        })
      )
    )) as unknown as TokenManager;
    console.log("Token Manager Address");
    for (let i = 0; i < 6; i++) {
      console.log(await tokenManager.getTokenAddress(i));
    }
    await tokenManager.waitForDeployment();

    // Transfer tokens to manager wallet and approve TokenManager
    for (const token of testTokens) {
      await token.transfer(managerWallet.address, INITIAL_SUPPLY / 2n);
      await token
        .connect(managerWallet)
        .approve(tokenManager.getAddress(), ethers.parseEther("2000"));
    }
  });

  describe("Deployment", () => {
    it("Should set the correct manager wallet", async () => {
      expect(await tokenManager.managerWallet()).to.equal(
        managerWallet.address
      );
    });

    it("Should register all tokens correctly", async () => {
      for (let i = 0; i < 6; i++) {
        const expectedAddress = await testTokens[i].getAddress();
        const actualAddress = await tokenManager.getTokenAddress(i);
        expect(actualAddress).to.equal(expectedAddress);
      }
    });

    it("Should set the deployer as authorized sender", async () => {
      expect(await tokenManager.isAuthorizedSender(owner.address)).to.be.true;
    });
  });

  describe("Token Operations", () => {
    const TRANSFER_AMOUNT = ethers.parseEther("1000");

    before(async () => {
      await tokenManager.addAuthorizedSender(user.address);
    });

    it("Should send tokens successfully", async () => {
      const tokenId = 0;
      const initialBalance = await testTokens[tokenId].balanceOf(user.address);

      await tokenManager
        .connect(user)
        .sendToken(tokenId, user.address, TRANSFER_AMOUNT);

      const finalBalance = await testTokens[tokenId].balanceOf(user.address);
      expect(finalBalance - initialBalance).to.equal(TRANSFER_AMOUNT);
    });

    it("Should fail if insufficient balance", async () => {
      const largeAmount = INITIAL_SUPPLY * 2n;

      await expect(
        tokenManager.connect(user).sendToken(0, user.address, largeAmount)
      ).to.be.revertedWith("Insufficient balance in manager wallet");
    });

    it("Should fail if sender is not authorized", async () => {
      await tokenManager.removeAuthorizedSender(user.address);

      await expect(
        tokenManager.connect(user).sendToken(0, user.address, TRANSFER_AMOUNT)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
