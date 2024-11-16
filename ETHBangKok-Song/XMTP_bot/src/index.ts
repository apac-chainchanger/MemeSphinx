import { run, HandlerContext } from "@xmtp/message-kit";
import { textGeneration, processMultilineResponse } from "@xmtp/message-kit";
import { agent_prompt } from "./prompt.js";
import { getUserInfo } from "@xmtp/message-kit";

// Game state interface
interface GameState {
  attempts: number;
  lastGameTime: number;
  isGameActive: boolean;
  currentCoin: string;
  usedHints: Set<number>;
}

// Game states storage
const gameStates: Map<string, GameState> = new Map();

// Cooldown time in milliseconds (30 seconds)
const COOLDOWN_TIME = 30000;
const MAX_ATTEMPTS = 3;

// Fun responses to encourage game start
const gameInvitations = [
  "That's interesting! But you know what would be more fun? Playing a guessing game! Type /start to play!",
  "Hey, while we're chatting, want to test your crypto knowledge? Type /start to begin!",
  "Cool! Speaking of that, I know a fun game we could play. Just type /start to try it out!",
  "I hear you! But you know what would make this conversation even better? A quick game! Type /start to join in!",
  "That's nice! But I'm really excited to play a game with you. Type /start and let's see if you can guess the mystery coin!",
  "Interesting point! While we're having this chat, why not try our crypto guessing game? Type /start to begin!",
  "That reminds me of a fun game I know! Want to try it? Just type /start!",
  "Sure, but have you tried our guessing game yet? It's really fun! Type /start to give it a shot!",
  "I get what you're saying! By the way, I've got this cool game we could play - just type /start!"
];

run(async (context: HandlerContext) => {
  const {
    message: {
      content: { text, params },
      sender,
    },
  } = context;

  try {
    let userPrompt = params?.prompt ?? text;
    const userInfo = await getUserInfo(sender.address);
    if (!userInfo) {
      console.log("User info not found");
      return;
    }

    // Initialize or get game state for the user
    if (!gameStates.has(sender.address)) {
      gameStates.set(sender.address, {
        attempts: 0,
        lastGameTime: 0,
        isGameActive: false,
        currentCoin: "",
        usedHints: new Set()
      });
    }

    const gameState = gameStates.get(sender.address)!;

    // Handle /start command
    if (userPrompt.startsWith("/start")) {
      // Check cooldown
      if (!gameState.isGameActive && 
          Date.now() - gameState.lastGameTime < COOLDOWN_TIME) {
        const remainingTime = Math.ceil((COOLDOWN_TIME - (Date.now() - gameState.lastGameTime)) / 1000);
        await context.send(`Please wait ${remainingTime} seconds before starting a new game.`);
        return;
      }
      startNewGame(gameState, context);
      return;
    }

    // If game is active, process game logic
    if (gameState.isGameActive) {
      // Process guess
      if (userPrompt.toLowerCase() === gameState.currentCoin.toLowerCase()) {
        // Correct guess
        await context.send("Congratulations! You've correctly guessed the MemeCoin! 🎉");
        await context.send("Now you can use our tools to learn more about crypto!");
        gameState.isGameActive = false;
        gameState.lastGameTime = Date.now();
        return;
      }

      // Wrong guess
      gameState.attempts++;
      if (gameState.attempts >= MAX_ATTEMPTS) {
        await context.send(`Game Over! The correct answer was ${gameState.currentCoin}. Try again in 30 seconds!`);
        gameState.isGameActive = false;
        gameState.lastGameTime = Date.now();
        return;
      }

      // Provide next hint
      const { reply } = await textGeneration(
        sender.address,
        `provide_hint ${gameState.currentCoin} ${gameState.attempts}`,
        await agent_prompt(userInfo)
      );
      await processMultilineResponse(sender.address, reply, context);
      
      await context.send(`You have ${MAX_ATTEMPTS - gameState.attempts} attempts remaining.`);
      
    } else {
      // For any other message, respond with a random invitation to play
      const randomInvitation = gameInvitations[Math.floor(Math.random() * gameInvitations.length)];
      await context.send(randomInvitation);
    }

  } catch (error) {
    console.error("Error during game processing:", error);
    await context.send("An error occurred while processing your request.");
  }
});

async function startNewGame(gameState: GameState, context: HandlerContext) {
  // Reset game state
  gameState.attempts = 0;
  gameState.isGameActive = true;
  gameState.usedHints = new Set();
  
  // Select random coin (this will be replaced with actual coin selection logic)
  const memeCoins = ["DOGE", "SHIB", "PEPE", "BONK", "WOJAK", "FLOKI"];
  gameState.currentCoin = memeCoins[Math.floor(Math.random() * memeCoins.length)];
  
  await context.send("Welcome to the MemeCoin Guessing Game! 🎮");
  await context.send("I'll give you hints about a popular MemeCoin. Try to guess which one it is!");
  await context.send("You have 3 attempts. Here's your first hint:");
  
  // Provide first hint
  const { reply } = await textGeneration(
    context.message.sender.address,
    `provide_hint ${gameState.currentCoin} 0`,
    await agent_prompt({ address: context.message.sender.address, preferredName: '' })
  );
  await processMultilineResponse(context.message.sender.address, reply, context);
}