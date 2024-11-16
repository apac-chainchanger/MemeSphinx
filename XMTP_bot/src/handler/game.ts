import { HandlerContext, SkillResponse } from "@xmtp/message-kit";
import { GameStats, ACHIEVEMENTS, initializeStats } from "../skills.js";
import { agent_prompt } from "../prompt.js";

// Game state interface
interface GameState {
  attempts: number;
  lastGameTime: number;
  isGameActive: boolean;
  currentCoin: string;
  usedHints: Set<number>;
  currentHintIndex: number;
}

// Storage for game states and stats
const gameStates: Map<string, GameState> = new Map();
const playerStats: Map<string, GameStats> = new Map();

// Constants
const COOLDOWN_TIME = 30000; // 30 seconds in milliseconds
const MAX_ATTEMPTS = 3;
const MEME_COINS = ["DOGE", "SHIB", "PEPE", "BONK", "WOJAK", "FLOKI"];

export async function handleGame(
  context: HandlerContext
): Promise<SkillResponse | undefined> {
  const {
    message: {
      sender,
      content: { skill, params },
    },
  } = context;

  // Initialize player stats if not exists
  if (!playerStats.has(sender.address)) {
    playerStats.set(sender.address, initializeStats());
  }

  // Get current stats
  const stats = playerStats.get(sender.address)!;

  // Handle different commands
  switch (skill) {
    case "start":
      return handleStartGame(context, sender.address);
    case "hint":
      return handleHintRequest(context, sender.address);
    case "stats":
      return handleStats(context, stats);
    case "rules":
      return handleRules();
    case "surrender":
      return handleSurrender(context, sender.address);
    default:
      return {
        code: 400,
        message: "Unknown command. Type /rules to see available commands.",
      };
  }
}

async function handleStartGame(
  context: HandlerContext,
  address: string
): Promise<SkillResponse> {
  // Check if game exists and cooldown
  if (gameStates.has(address)) {
    const existingGame = gameStates.get(address)!;
    if (existingGame.isGameActive) {
      return {
        code: 400,
        message: "You already have an active game! Type /surrender to give up.",
      };
    }
    if (Date.now() - existingGame.lastGameTime < COOLDOWN_TIME) {
      const remainingTime = Math.ceil(
        (COOLDOWN_TIME - (Date.now() - existingGame.lastGameTime)) / 1000
      );
      return {
        code: 400,
        message: `Please wait ${remainingTime} seconds before starting a new game.`,
      };
    }
  }

  // Initialize new game
  const newGame: GameState = {
    attempts: 0,
    lastGameTime: Date.now(),
    isGameActive: true,
    currentCoin: MEME_COINS[Math.floor(Math.random() * MEME_COINS.length)],
    usedHints: new Set(),
    currentHintIndex: 0,
  };
  gameStates.set(address, newGame);

  // Update stats
  const stats = playerStats.get(address)!;
  stats.gamesPlayed++;
  stats.lastPlayedDate = Date.now();

  // Send first hint
  await context.send("🎮 Welcome to the MemeCoin Guessing Game! 🎮");
  await context.send(
    "Try to guess the MemeCoin based on the hints. You have 3 attempts!"
  );
  
  const { reply } = await context.llm.generate(
    `provide_hint ${newGame.currentCoin} ${newGame.currentHintIndex}`,
    await agent_prompt({ address })
  );
  
  return {
    code: 200,
    message: `Here's your first hint:\n\n${reply}`,
  };
}

async function handleHintRequest(
  context: HandlerContext,
  address: string
): Promise<SkillResponse> {
  const gameState = gameStates.get(address);
  if (!gameState || !gameState.isGameActive) {
    return {
      code: 400,
      message: "No active game. Type /start to begin a new game!",
    };
  }

  const { reply } = await context.llm.generate(
    `provide_hint ${gameState.currentCoin} ${gameState.currentHintIndex}`,
    await agent_prompt({ address })
  );

  return {
    code: 200,
    message: `Current hint:\n\n${reply}\n\nYou have ${
      MAX_ATTEMPTS - gameState.attempts
    } attempts remaining.`,
  };
}

function handleStats(
  context: HandlerContext,
  stats: GameStats
): SkillResponse {
  const winRate = stats.gamesPlayed > 0
    ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1)
    : "0.0";

  let message = `📊 Your Game Statistics 📊\n\n`;
  message += `Games Played: ${stats.gamesPlayed}\n`;
  message += `Games Won: ${stats.gamesWon}\n`;
  message += `Win Rate: ${winRate}%\n`;
  message += `Current Streak: ${stats.currentStreak}\n`;
  message += `Best Streak: ${stats.bestStreak}\n`;
  message += `Average Attempts: ${stats.averageAttempts.toFixed(1)}\n\n`;

  // Add achievements section if any
  if (stats.achievements.size > 0) {
    message += `🏆 Achievements Unlocked 🏆\n`;
    stats.achievements.forEach((achievementId) => {
      const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];
      message += `- ${achievement.name}: ${achievement.description}\n`;
    });
  }

  return {
    code: 200,
    message,
  };
}

function handleRules(): SkillResponse {
  return {
    code: 200,
    message: `🎮 MemeCoin Guessing Game Rules 🎮

1. You'll receive three hints about a popular MemeCoin
2. Try to guess which coin it is
3. You have 3 attempts to guess correctly
4. If you fail, you'll need to wait 30 seconds to play again

Commands:
/start - Start a new game
/hint - See current hint again
/stats - View your game statistics
/rules - Show these rules
/surrender - Give up current game

Happy guessing! 🎯`,
  };
}

async function handleSurrender(
  context: HandlerContext,
  address: string
): Promise<SkillResponse> {
  const gameState = gameStates.get(address);
  if (!gameState || !gameState.isGameActive) {
    return {
      code: 400,
      message: "No active game to surrender!",
    };
  }

  // End the game
  gameState.isGameActive = false;
  gameState.lastGameTime = Date.now();

  // Update stats
  const stats = playerStats.get(address)!;
  stats.currentStreak = 0;

  return {
    code: 200,
    message: `Game Over! The coin was ${gameState.currentCoin}. Try again in 30 seconds!`,
  };
}

export async function processGuess(
  context: HandlerContext,
  address: string,
  guess: string
): Promise<SkillResponse> {
  const gameState = gameStates.get(address);
  if (!gameState || !gameState.isGameActive) {
    return {
      code: 400,
      message: "No active game. Type /start to begin!",
    };
  }

  const stats = playerStats.get(address)!;

  // Check if guess is correct
  if (guess.toUpperCase() === gameState.currentCoin) {
    // Update game state
    gameState.isGameActive = false;
    gameState.lastGameTime = Date.now();

    // Update stats
    stats.gamesWon++;
    stats.currentStreak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.averageAttempts =
      (stats.averageAttempts * (stats.gamesWon - 1) + gameState.attempts + 1) /
      stats.gamesWon;

    // Check for achievements
    checkAndAwardAchievements(stats, gameState.attempts);

    return {
      code: 200,
      message:
        `🎉 Congratulations! You've correctly guessed ${gameState.currentCoin}! 🎉\n\n` +
        `You can now use our crypto tools! Type /rules to see available commands.`,
    };
  }

  // Handle incorrect guess
  gameState.attempts++;
  if (gameState.attempts >= MAX_ATTEMPTS) {
    gameState.isGameActive = false;
    gameState.lastGameTime = Date.now();
    stats.currentStreak = 0;

    return {
      code: 400,
      message: `Game Over! The correct answer was ${gameState.currentCoin}. Try again in 30 seconds!`,
    };
  }

  // Provide next hint
  gameState.currentHintIndex++;
  const { reply } = await context.llm.generate(
    `provide_hint ${gameState.currentCoin} ${gameState.currentHintIndex}`,
    await agent_prompt({ address })
  );

  return {
    code: 200,
    message: `Wrong guess! Here's your next hint:\n\n${reply}\n\nYou have ${
      MAX_ATTEMPTS - gameState.attempts
    } attempts remaining.`,
  };
}

function checkAndAwardAchievements(stats: GameStats, attempts: number): void {
  // First win
  if (stats.gamesWon === 1) {
    stats.achievements.add(ACHIEVEMENTS.FIRST_WIN.id);
  }

  // Quick solver (won with first hint)
  if (attempts === 0) {
    stats.achievements.add(ACHIEVEMENTS.QUICK_SOLVER.id);
  }

  // Persistent player
  if (stats.gamesWon === 5) {
    stats.achievements.add(ACHIEVEMENTS.PERSISTENT.id);
  }

  // Streak master
  if (stats.currentStreak === 3) {
    stats.achievements.add(ACHIEVEMENTS.STREAK_MASTER.id);
  }
}