# MemeSphinx Token Manager

MemeSphinx Token Manager is a smart contract system designed to handle MEME coin distribution for the MemeSphinx game. Built using Hardhat, it provides secure and efficient token management capabilities for rewarding players who correctly solve MEME coin riddles.

🌟 Key Features
🔐 Secure Token Management

- ERC20 Token Support: Manages multiple MEME tokens through a single interface
- Random Distribution: Secure random number generation for fair token distribution
- Access Control: Role-based permissions for authorized senders
- Reentrancy Protection: Built-in guards against common smart contract vulnerabilities

💼 Administrative Functions

- Token Registration: Add/remove supported tokens
- Wallet Management: Update manager wallet for token storage
- Sender Authorization: Control who can trigger token distributions
- Balance Monitoring: Track token balances and distributions

🔄 Token Operations

- Random Amount Distribution: Sends random amounts between 10-100 tokens
- Multi-token Support: Handles multiple MEME tokens simultaneously
- Balance Queries: Real-time balance checking for all supported tokens

🛠️ How It Works

1. Token Setup

- Deploy test tokens (tDOGE, tPEPE, tSHIB)
- Register tokens in TokenManager
- Approve TokenManager for token transfers

2. Token Distribution

- Authorized senders trigger token distributions
- Smart contract determines random amount
- Tokens transferred from manager wallet to winners

3. Monitoring

- Track all token operations through events
- Query balances and supported tokens
- Monitor authorized senders

🚀 Getting Started

## Prerequisites

- Node.js >= v18.20.4
- Hardhat 2.22.15
- Flow Testnet account with FLOW tokens

## Installation & Setup

1. Install Dependencies

```shell
npm install
```

2. Configure Environment
   Create a `.env` file with:

```
FLOW_TESTNET_PRIVATE_KEY=your_private_key
FLOW_TESTNET_PUBLIC_KEY=your_public_key
RPC_URL=https://testnet.evm.nodes.onflow.org
```

3. Deploy Test Tokens

```shell
npx hardhat run scripts/deployTestToken.ts --network flowTestnet
```

This will deploy three test tokens (tDOGE, tPEPE, tSHIB) and output their addresses.

4. Deploy Token Manager

```shell
npx hardhat run scripts/deployTokenManager.ts --network flowTestnet
```

This creates a `token-manager-deployment.json` file with contract details.

🔐 Security Considerations

- Manager wallet must maintain sufficient token balances
- Only authorized senders can trigger distributions
- Token approvals must be managed carefully
- Regular balance monitoring recommended

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

🤝 Support
For support and contributions, please open an issue in the GitHub repository or contact the development team.

🌟 Acknowledgments

- OpenZeppelin: For secure smart contract components
- Hardhat: For development environment
- Flow Blockchain: For testnet infrastructure

Start managing your MEME tokens with MemeSphinx Token Manager today!

