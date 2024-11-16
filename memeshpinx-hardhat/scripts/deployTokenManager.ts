import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TokenManager with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Deploy TokenManager
  console.log("\nDeploying TokenManager...");
  const TokenManager = await ethers.getContractFactory("TokenManager");
  const tokenManager = await TokenManager.deploy(deployer.address);
  await tokenManager.waitForDeployment();

  const tokenManagerAddress = await tokenManager.getAddress();

  console.log("\nDeployment Summary:");
  console.log("====================");
  console.log("TokenManager deployed to:", tokenManagerAddress);
  console.log("Owner:", await tokenManager.owner());
  console.log("Manager Wallet:", await tokenManager.managerWallet());

  // Save deployment info
  const deploymentInfo = {
    tokenManager: tokenManagerAddress,
    owner: await tokenManager.owner(),
    managerWallet: await tokenManager.managerWallet(),
    networkName: "Flow Testnet",
    deploymentTime: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    "token-manager-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to token-manager-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
