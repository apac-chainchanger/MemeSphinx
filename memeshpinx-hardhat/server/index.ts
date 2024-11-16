import * as dotenv from "dotenv";
import { ethers } from "ethers";
import express from "express";
import asyncHandler from "express-async-handler";
import { TokenOperations } from "../util/tokenOperations";

dotenv.config();

const app = express();
app.use(express.json());

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const TOKEN_MANAGER_ADDRESS = "0x9500425f4D0D9e60650332A3AB8bf3F42F63A89E";

// Initialize TokenOperations
const tokenOps = new TokenOperations(
  TOKEN_MANAGER_ADDRESS,
  RPC_URL,
  PRIVATE_KEY
);

// Middleware to validate address
const validateAddress = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const address = req.params.address;
  if (!ethers.isAddress(address)) {
    res.status(400).json({ error: "Invalid Ethereum address" });
    return;
  }
  next();
};

// POST endpoint for sending tokens
app.post(
  "/send/:address",
  validateAddress,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { symbol, amount } = req.body;
    const destinationAddress = req.params.address;

    // Validate request body
    if (!symbol || !amount) {
      res.status(400).json({
        error: "Missing required parameters",
        required: { symbol: "string", amount: "number" },
      });
      return;
    }

    // Convert amount to BigInt with 18 decimals (assuming ERC20 standard)
    const tokenAmount = ethers.parseEther(amount.toString());

    // Send tokens
    const txHash = await tokenOps.sendToken(
      symbol,
      destinationAddress,
      true // Wait for confirmation
    );

    res.json({
      success: true,
      transaction: {
        hash: txHash,
        symbol,
        amount,
        recipient: destinationAddress,
      },
    });
  })
);

// Health check endpoint
app.get(
  "/health",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({ status: "healthy" });
  })
);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
