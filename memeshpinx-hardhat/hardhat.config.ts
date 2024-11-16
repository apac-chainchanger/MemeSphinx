import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      accounts: [
        // WARNING: THIS IS TEST NET PRIVATE KEY. YOU MUST CHANGE IT AND USE WITH ENV
        `89729595ed3e867ab8dc667589a1af4d2fe3b208da56d1605196fc2a07126cc5`,
      ],
      gas: 500000,
    },
  },
};

export default config;
