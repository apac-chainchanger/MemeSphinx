import { handleEns } from "./handler/ens.js";
import { handleGame } from "./handler/game.js"; // 새로운 게임 핸들러를 위한 import
import type { SkillGroup } from "@xmtp/message-kit";

export const skills: SkillGroup[] = [
  {
    name: "Crypto Game Bot",
    tag: "@game",
    description: "Play the MemeCoin guessing game and learn about crypto!",
    skills: [
      {
        skill: "/start",
        triggers: ["/start"],
        handler: handleGame,
        description: "Start a new game of MemeCoin guessing.",
        examples: ["/start"],
        params: {}
      },
      {
        skill: "/hint",
        triggers: ["/hint"],
        handler: handleGame,
        description: "Request current hint again without using an attempt.",
        examples: ["/hint"],
        params: {}
      },
      {
        skill: "/stats",
        triggers: ["/stats"],
        handler: handleGame,
        description: "View your game statistics and achievements.",
        examples: ["/stats"],
        params: {}
      },
      {
        skill: "/rules",
        triggers: ["/rules"],
        handler: handleGame,
        description: "Display game rules and how to play.",
        examples: ["/rules"],
        params: {}
      },
      {
        skill: "/surrender",
        triggers: ["/surrender"],
        handler: handleGame,
        description: "Give up current game (will count as a loss).",
        examples: ["/surrender"],
        params: {}
      }
    ]
  },
  {
    name: "Crypto Tools",
    tag: "@tools",
    description: "Tools available after winning the game",
    skills: [
      {
        skill: "/register [domain]",
        triggers: ["/register"],
        handler: handleEns,
        description:
          "Register a new ENS domain. Returns a URL to complete the registration process.",
        examples: ["/register vitalik.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/exists",
        examples: ["/exists"],
        handler: handleEns,
        triggers: ["/exists"],
        description: "Check if an address is onboarded.",
        params: {
          address: {
            type: "address",
          },
        },
      },
      {
        skill: "/info [domain]",
        triggers: ["/info"],
        handler: handleEns,
        description:
          "Get detailed information about an ENS domain including owner, expiry date, and resolver.",
        examples: ["/info nick.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/renew [domain]",
        triggers: ["/renew"],
        handler: handleEns,
        description:
          "Extend the registration period of your ENS domain. Returns a URL to complete the renewal.",
        examples: ["/renew fabri.base.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/check [domain]",
        triggers: ["/check"],
        handler: handleEns,
        examples: ["/check vitalik.eth", "/check fabri.base.eth"],
        description: "Check if a domain is available.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/cool [domain]",
        triggers: ["/cool"],
        examples: ["/cool vitalik.eth"],
        handler: handleEns,
        description: "Get cool alternatives for a .eth domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/tip [address]",
        description: "Show a URL for tipping a domain owner.",
        triggers: ["/tip"],
        handler: handleEns,
        examples: ["/tip 0x1234567890123456789012345678901234567890"],
        params: {
          address: {
            type: "string",
          },
        },
      }
    ],
  },
];

// Game achievements definitions
export const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: "first_win",
    name: "First Victory",
    description: "Win your first game"
  },
  QUICK_SOLVER: {
    id: "quick_solver",
    name: "Quick Solver",
    description: "Guess correctly on the first hint"
  },
  PERSISTENT: {
    id: "persistent",
    name: "Persistent Player",
    description: "Win 5 games in total"
  },
  STREAK_MASTER: {
    id: "streak_master",
    name: "Streak Master",
    description: "Win 3 games in a row"
  }
};

// Stats tracking interface
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  averageAttempts: number;
  achievements: Set<string>;
  lastPlayedDate: number;
}

// Initialize empty stats
export function initializeStats(): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageAttempts: 0,
    achievements: new Set(),
    lastPlayedDate: Date.now()
  };
}