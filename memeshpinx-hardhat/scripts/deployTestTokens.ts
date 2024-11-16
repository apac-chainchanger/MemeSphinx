import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying test tokens with the account:", deployer.address);

  const tokenData = [
    { name: "Test DOGE", symbol: "tDOGE", decimals: 18, unit: "ether" },
    { name: "Test PEPE", symbol: "tPEPE", decimals: 18, unit: "ether" },
    { name: "Test SHIB", symbol: "tSHIB", decimals: 18, unit: "ether" },
  ];

  const TokenFactory = await ethers.getContractFactory("TestToken");
  const deployedTokens = [];

  console.log("Deploying test tokens...\n");

  for (const token of tokenData) {
    const initialSupply = ethers.parseUnits("1000000", token.unit);

    const tokenContract = await TokenFactory.deploy(
      token.name,
      token.symbol,
      token.decimals,
      initialSupply
    );

    await tokenContract.waitForDeployment();
    const tokenAddress = await tokenContract.getAddress();

    console.log(`${token.name} (${token.symbol}):`);
    console.log(`  Address: ${tokenAddress}`);
    console.log(`  Initial Supply: ${initialSupply}\n`);

    deployedTokens.push({
      name: token.name,
      symbol: token.symbol,
      address: tokenAddress,
    });
  }

  // Save deployed addresses for future use
  console.log("All deployed token addresses:");
  console.log(deployedTokens.map((t) => t.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
