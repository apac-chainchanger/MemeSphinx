# MemeSphinx Token Manager

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

## Prerequisites

- Node.js v18.20.4
- Hardhat 2.22.15

## How to deploy

```shell
# Install npm packages
npm i
```

```shell
# Compile Token Manager
npx hardhat compile
```

```shell
# Deploy Test Token
npx hardhat run scripts/deployTestToken.ts --network flowTestnet
# Will print like below
# Deploying test tokens with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Deploying test tokens...

# Test DOGE (tDOGE):
#   Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
#   Initial Supply: 1000000000000000000000000

# Test PEPE (tPEPE):
#   Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
#   Initial Supply: 1000000000000000000000000

# Test SHIB (tSHIB):
#   Address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
#   Initial Supply: 1000000000000000000000000

# All deployed token addresses:
# [
#   '0x5FbDB2315678afecb367f032d93F642f64180aa3',
#   '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
#   '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
# ]
```

```shell
# Deploy Token Manager
npx hardhat run scripts/deployTokenManager.ts --network flowTestnet
# Will get file token-manager-deployment.json
```
