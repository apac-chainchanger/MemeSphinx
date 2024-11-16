import { HandlerContext, SkillResponse, textGeneration, UserInfo, getUserInfo } from "@xmtp/message-kit";
import { game_prompt } from "../prompt.js";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// Token Info
interface TokenInfo {
  symbol: string;
  address: string;
  initialSupply: bigint;
}

// Token Operations

// ABI definitions
const TOKEN_MANAGER_ABI = [
  "function registerToken(string memory symbol, address tokenAddress) external",
  "function sendToken(string memory symbol, address destination, uint256 amount) external",
  "function managerWallet() external view returns (address)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export class TokenOperations {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private tokenManager: ethers.Contract;

  constructor(tokenManagerAddress: string, rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.tokenManager = new ethers.Contract(
      tokenManagerAddress,
      TOKEN_MANAGER_ABI,
      this.signer
    );
  }

  /**
   * 토큰 등록
   */
  async registerToken(symbol: string, tokenAddress: string): Promise<string> {
    try {
      console.log(`Registering token ${symbol} at address ${tokenAddress}...`);
      const tx = await this.tokenManager.registerToken(symbol, tokenAddress);
      const receipt = await tx.wait();
      console.log(`Token registered. Transaction hash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error(`Failed to register token ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 토큰 전송
   */
  async sendToken(
    symbol: string,
    destination: string,
    amount: string | bigint,
    waitForConfirmation: boolean = true
  ): Promise<string> {
    try {
      console.log(`Sending ${amount} ${symbol} to ${destination}...`);
      const tx = await this.tokenManager.sendToken(symbol, destination, amount);

      if (waitForConfirmation) {
        const receipt = await tx.wait();
        console.log(`Tokens sent. Transaction hash: ${receipt.hash}`);
        return receipt.hash;
      }

      return tx.hash;
    } catch (error) {
      console.error(`Failed to send token ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * ERC20 토큰 승인
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string | bigint,
    waitForConfirmation: boolean = true
  ): Promise<string> {
    try {
      console.log(`Approving ${amount} tokens for ${spenderAddress}...`);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const tx = await token.approve(spenderAddress, amount);

      if (waitForConfirmation) {
        const receipt = await tx.wait();
        console.log(`Approval complete. Transaction hash: ${receipt.hash}`);
        return receipt.hash;
      }

      return tx.hash;
    } catch (error) {
      console.error("Failed to approve tokens:", error);
      throw error;
    }
  }

  /**
   * 현재 승인된 수량 확인
   */
  async getAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.allowance(ownerAddress, spenderAddress);
  }

  /**
   * 토큰 잔액 조회
   */
  async getTokenBalance(
    tokenAddress: string,
    addressToCheck: string
  ): Promise<bigint> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.balanceOf(addressToCheck);
  }

  /**
   * 토큰의 소수점 자릿수 조회
   */
  async getTokenDecimals(tokenAddress: string): Promise<number> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.decimals();
  }
}

// Constants
const GAME_CONSTANTS = {
  MAX_ATTEMPTS: 3,
  COOLDOWN_SECONDS: 30,
  REWARD_AMOUNT: "100", // Define reward amount for winners
  REWARD_TOKEN: "MCOIN" // Define reward token
} as const;

const RESPONSE_PATTERNS = {
  WRONG: "WRONG",
  VICTORY: "VICTORY",
  DEFEAT: "DEFEAT"
} as const;

const MEME_COINS = {
  "DOGE": {
    hints: [
      "I am the original meme, born from a Shiba's smile",
      "Elon's tweets make me wag my tail", 
      "Much wow, such coin, very crypto"
    ]
  },
  "PEPE": {
    hints: [
      "Born from the rarest of images, I bring joy to the web",
      "Green is my color, chaos is my game",
      "From imageboards to blockchain, I am the face of resistance"
    ]
  },
  "SHIB": {
    hints: [
      "I followed in the pawsteps of the original",
      "They call me the DOGE killer",
      "My army grows stronger with each passing day"
    ]
  }
} as const;

// Types
export enum GameState {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress", 
  COOLDOWN = "cooldown",
  WAITING_FOR_WALLET = "waiting_for_wallet"
}

export interface UserSession {
  address: string;
  state: GameState;
  cooldownUntil: number;
  hintCount: number;
  attemptsLeft: number;
  currentCoin: string;
  lastHint: string;
  userInfo?: UserInfo;
}

// Enhanced UserInfo interface
interface ExtendedUserInfo extends UserInfo {
  ensDomain?: string;
  ensInfo?: {
    avatar?: string;
    description?: string;
    ens_primary?: string;
    github?: string;
    resolverAddress?: string;
    twitter?: string;
  };
}

// Database
class MemeDatabase {
  private currentCoin: string | null = null;
  private hintIndex: number = 0;

  selectRandomCoin(): string {
    const coins = Object.keys(MEME_COINS);
    this.currentCoin = coins[Math.floor(Math.random() * coins.length)];
    this.hintIndex = 0;
    return this.currentCoin;
  }

  getNextHint(): string | null {
    if (!this.currentCoin) return null;
    const hints = MEME_COINS[this.currentCoin as keyof typeof MEME_COINS].hints;
    if (this.hintIndex >= hints.length) return null;
    return hints[this.hintIndex++];
  }

  checkAnswer(answer: string): boolean {
    if (!this.currentCoin) return false;
    return answer.toUpperCase() === this.currentCoin;
  }

  reset(): void {
    this.currentCoin = null;
    this.hintIndex = 0;
  }
}

const memeDb = new MemeDatabase();

// Victory Handler
async function handleVictory(context: HandlerContext, session: UserSession): Promise<void> {
  try {
    const { address } = session;

    // Send congratulatory message
    await context.send(`🎉 Congratulations! You've won ${GAME_CONSTANTS.REWARD_AMOUNT} ${GAME_CONSTANTS.REWARD_TOKEN}!`);
    
    // Reset session state
    session.state = GameState.NOT_STARTED;
    session.attemptsLeft = GAME_CONSTANTS.MAX_ATTEMPTS;
    session.currentCoin = "";
    
    // Here you can add your custom reward distribution logic
    // For example:
    await distributeReward(address);
    
    // Send follow-up message
    await context.send("🎮 Want to play again? Just say 'play' or ask a new riddle!");
    
  } catch (error) {
    console.error("Error in handleVictory:", error);
    await context.send("❌ Error processing victory rewards. Please contact support.");
  }
}

// Reward distribution function
async function distributeReward(address: string): Promise<void> {
  try {
    // Add your reward distribution logic here
    // For example:
    // await sendTokens(address, GAME_CONSTANTS.REWARD_AMOUNT, GAME_CONSTANTS.REWARD_TOKEN);
    console.log(`Reward distributed to ${address}`);
    const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
    const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY"; // managerWallet의 private key
  
    const TOKEN_MANAGER_ADDRESS = "0x9500425f4D0D9e60650332A3AB8bf3F42F63A89E";
    const MANAGER_WALLET = "0x21E122B701aFae76085e31faDCfDF16C0E40452b";
    // 테스트 수신자 주소 .env에 저장
    const TEST_RECIPIENT = process.env.TEST_RECIPIENT || "";
  
    const tokens: TokenInfo[] = [
      {
        symbol: "tDOGE",
        address: "0x3129Db2b25044Fc2AfCD848eC9bf1fa2E1E085A7",
        initialSupply: ethers.parseEther("1000000"),
      },
      {
        symbol: "tPEPE",
        address: "0xf8d866693e16BAf0f64337264FF99Eb1F3209253",
        initialSupply: ethers.parseEther("1000000"),
      },
      {
        symbol: "tSHIB",
        address: "0x85780D4ccC843F01C16389B0C95B8d8916C61611",
        initialSupply: ethers.parseEther("1000000"),
      },
    ];
  
    // Initialize TokenOperations
    const tokenOps = new TokenOperations(
      TOKEN_MANAGER_ADDRESS,
      RPC_URL,
      PRIVATE_KEY
    );
    const sendAmount = ethers.parseEther("100"); // Send 100 tokens
    
    const sendTx = await tokenOps.sendToken(
      ["tDOGE", "tPEPE", "tSHIB"][Math.floor(Math.random() * 3)],
      TEST_RECIPIENT,
      sendAmount
    );
    console.log(`Send transaction: ${sendTx}`);

    // Wait for a moment to ensure transaction is processed
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error("Error in distributeReward:", error);
    throw error;
  }
}

// Game Manager
class GameManager {
  private sessions: Map<string, UserSession> = new Map();

  async getSession(address: string): Promise<UserSession> {
    let session = this.sessions.get(address);
    if (!session) {
      // Fetch user info when creating new session
      const userInfo = await getUserInfo(address);
      
      session = {
        address,
        state: GameState.NOT_STARTED,
        cooldownUntil: 0,
        hintCount: 0,
        attemptsLeft: GAME_CONSTANTS.MAX_ATTEMPTS,
        currentCoin: "",
        lastHint: "",
        userInfo: userInfo || undefined // Store user info in session
      };
      this.sessions.set(address, session);
    }
    return session!;
  }

  isInCooldown(address: string): boolean {
    const session = this.sessions.get(address);
    if (!session || session.state !== GameState.COOLDOWN) return false;
    const now = Date.now();
    if (now >= session.cooldownUntil) {
      session.state = GameState.NOT_STARTED;
      return false;
    }
    return true;
  }

  setCooldown(address: string): void {
    const session = this.sessions.get(address);
    if (session) {
      session.state = GameState.COOLDOWN;
      session.cooldownUntil = Date.now() + GAME_CONSTANTS.COOLDOWN_SECONDS * 1000;
    }
  }
}

export const gameManager = new GameManager();

export async function handleGame(
  context: HandlerContext
): Promise<SkillResponse | undefined> {
  const {
    message: { content: { text = "" }, sender },
  } = context;

  console.log("1. Starting handleGame with sender:", sender);

  if (!sender?.address) {
    console.log("2. Error: No sender address found");
    return { code: 400, message: "Sender address required" };
  }

  try {
    console.log("3. Checking cooldown for address:", sender.address);
    if (gameManager.isInCooldown(sender.address)) {
      const session = await gameManager.getSession(sender.address);
      const remainingTime = Math.ceil((session.cooldownUntil - Date.now()) / 1000);
      console.log("4. User in cooldown. Remaining time:", remainingTime);
      return { 
        code: 429, 
        message: `🕒 Please wait ${remainingTime} seconds before your next attempt...` 
      };
    }

    const session = await gameManager.getSession(sender.address);
    const userInfo = session.userInfo || await getUserInfo(sender.address);

    console.log("6. Calling textGeneration with userInfo:", userInfo);
    const { reply } = await textGeneration(
      sender.address,
      text,
      await game_prompt(userInfo!)
    );
    console.log("7. Received reply:", reply);

    const combinedMessage = Array.isArray(reply) ? reply.join('\n') : reply;
    
    if (combinedMessage.includes(RESPONSE_PATTERNS.VICTORY)) {
      console.log("8. Victory condition met");
      await handleVictory(context, session);
    } else if (combinedMessage.includes(RESPONSE_PATTERNS.DEFEAT)) {
      console.log("8. Defeat condition met");
      gameManager.setCooldown(sender.address);
    } else if (combinedMessage.includes(RESPONSE_PATTERNS.WRONG)) {
      console.log("8. Wrong answer. Attempts left:", session.attemptsLeft - 1);
      session.attemptsLeft--;
      if (session.attemptsLeft <= 0) {
        console.log("9. No attempts left, setting cooldown");
        gameManager.setCooldown(sender.address);
      }
    }

    return { code: 200, message: combinedMessage };
  } catch (error) {
    console.error("10. Error in handleGame:", error);
    return { code: 500, message: "Error processing request" };
  }
}
