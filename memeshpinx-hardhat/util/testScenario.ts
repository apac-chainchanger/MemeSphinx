import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { TokenOperations } from "./tokenOperations";

dotenv.config();

interface TokenInfo {
  symbol: string;
  address: string;
  initialSupply: bigint;
}

async function runTestScenario() {
  // Configuration
  const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY"; // managerWallet의 private key
  const TOKEN_MANAGER_ADDRESS = "0x861588D857D29f19F8392D7B690a850df9dC4967";
  const MANAGER_WALLET = "0x21E122B701aFae76085e31faDCfDF16C0E40452b";
  const TEST_RECIPIENT = process.env.TEST_RECIPIENT || "";

  const tokens: TokenInfo[] = [
    {
      symbol: "tDOGE",
      address: "0xABcc90065Bf7eF7Cb3418a631F9144B71558449c",
      initialSupply: ethers.parseEther("1000000"),
    },
    {
      symbol: "tPEPE",
      address: "0x66509854F4D88e917809537FD878868Ef3a40a5e",
      initialSupply: ethers.parseEther("1000000"),
    },
    {
      symbol: "tSHIB",
      address: "0x7eB7f2af9e396f4888d1C6D3EB9487f7542c18b7",
      initialSupply: ethers.parseEther("1000000"),
    },
  ];

  // Initialize TokenOperations
  const tokenOps = new TokenOperations(
    TOKEN_MANAGER_ADDRESS,
    RPC_URL,
    PRIVATE_KEY
  );

  try {
    console.log("Starting Token Test Scenario\n");
    console.log("=== Initial Setup ===");

    // Test each token
    for (const token of tokens) {
      console.log(`\nTesting ${token.symbol}:`);

      // 1. Check initial balance
      console.log(`\nStep 1: Checking initial balance for ${token.symbol}`);
      try {
        console.log("Checking token address:", token.address); // 토큰 주소 출력
        const balance = await tokenOps.getTokenBalance(
          token.address,
          MANAGER_WALLET
        );
        console.log(`Initial balance for ${token.symbol}:`, balance);
      } catch (error) {
        console.error("Detailed error:", error); // 더 자세한 에러 정보 출력
        throw error;
      }
      console.log(
        `Initial balance: ${ethers.formatEther(token.initialSupply)} ${
          token.symbol
        }`
      );

      // 2. Check current allowance
      console.log(`\nStep 2: Checking current allowance for ${token.symbol}`);
      const currentAllowance = await tokenOps.getAllowance(
        token.address,
        MANAGER_WALLET,
        TOKEN_MANAGER_ADDRESS
      );
      console.log(
        `Current allowance: ${ethers.formatEther(currentAllowance)} ${
          token.symbol
        }`
      );

      // 3. Approve TokenManager if needed (approving max amount for testing)
      if (currentAllowance === 0n) {
        console.log(`\nStep 3: Approving TokenManager for ${token.symbol}`);
        const approveTx = await tokenOps.approveToken(
          token.address,
          TOKEN_MANAGER_ADDRESS,
          ethers.MaxUint256
        );
        console.log(`Approval transaction: ${approveTx}`);
      } else {
        console.log(
          `\nStep 3: TokenManager already approved for ${token.symbol}`
        );
      }

      // 4. Register token in TokenManager (if not already registered)
      console.log(`\nStep 4: Registering ${token.symbol} in TokenManager`);
      try {
        const registerTx = await tokenOps.registerToken(
          token.symbol,
          token.address
        );
        console.log(`Registration transaction: ${registerTx}`);
      } catch (error: any) {
        if (error.message.includes("Symbol already registered")) {
          console.log(`${token.symbol} is already registered`);
        } else {
          throw error;
        }
      }

      // 5. Test random number generation
      console.log(`\nStep 5: Testing random number generation`);
      try {
        const randomNumber = await tokenOps.getRandomInRange(10, 100);
        console.log(`Generated random number: ${randomNumber}`);
      } catch (error) {
        console.error("Failed to generate random number:", error);
      }

      // 6. Send tokens (random amount will be determined by contract)
      console.log(`\nStep 6: Sending ${token.symbol} tokens`);
      try {
        const sendTx = await tokenOps.sendToken(token.symbol, TEST_RECIPIENT);
        console.log(`Send transaction: ${sendTx}`);

        // Wait for a moment to ensure transaction is processed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 7. Check final balances
        console.log(`\nStep 7: Checking final balances for ${token.symbol}`);
        const finalManagerBalance = await tokenOps.getTokenBalance(
          token.address,
          MANAGER_WALLET
        );
        const finalRecipientBalance = await tokenOps.getTokenBalance(
          token.address,
          TEST_RECIPIENT
        );

        console.log(
          `Final manager balance: ${ethers.formatEther(finalManagerBalance)} ${
            token.symbol
          }`
        );
        console.log(
          `Final recipient balance: ${ethers.formatEther(
            finalRecipientBalance
          )} ${token.symbol}`
        );

        // Verify transfer
        if (finalRecipientBalance > 0n) {
          console.log(`✅ Transfer successful for ${token.symbol}`);
        } else {
          console.log(`❌ Transfer verification failed for ${token.symbol}`);
        }
      } catch (error) {
        console.error(`Error sending ${token.symbol}:`, error);
      }

      console.log("\n" + "=".repeat(50));
    }

    // 8. Get all supported tokens and their balances
    console.log("\nStep 8: Getting all supported tokens and balances");
    try {
      const [symbols, balances] = await tokenOps.getAllBalances(); // tokenManager 직접 접근 대신 메소드 사용
      console.log("\nAll registered tokens and their balances:");
      for (let i = 0; i < symbols.length; i++) {
        console.log(`${symbols[i]}: ${ethers.formatEther(balances[i])}`);
      }
    } catch (error) {
      console.error("Failed to get all balances:", error);
    }
  } catch (error) {
    console.error("Test scenario failed:", error);
  }
}

// Run the scenario
runTestScenario()
  .then(() => {
    console.log("\nTest scenario completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
