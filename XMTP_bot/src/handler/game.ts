import { HandlerContext, SkillResponse, textGeneration, UserInfo, getUserInfo } from "@xmtp/message-kit";
import { game_prompt } from "../prompt.js";

// Constants
const GAME_CONSTANTS = {
  MAX_ATTEMPTS: 3,
  COOLDOWN_SECONDS: 30,
  REWARD_AMOUNT: "100", // Define reward amount for winners
  REWARD_TOKEN: "MCOIN" // Define reward token
} as const;

const RESPONSE_PATTERNS = {
  WRONG: "[WRONG]",
  VICTORY: "[VICTORY]",
  DEFEAT: "[DEFEAT]"
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