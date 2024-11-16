import { handleGame } from "./handler/game.js";
import type { SkillGroup, HandlerContext, SkillResponse } from "@xmtp/message-kit";

type SkillHandler = (context: HandlerContext) => Promise<SkillResponse | undefined>;

export const skills: SkillGroup[] = [{
  name: "Meme Coin Sphinx",
  tag: "@sphinx",
  description: "Meme Coin riddle game",
  skills: [{
    skill: "game",
    triggers: ["play", "game", "riddle", "sphinx", "lets", "go", "start"],
    handler: handleGame as SkillHandler,
    description: "Play the Meme Coin riddle game",
    examples: ["Let's play", "Is it DOGE?"],
    params: { text: { type: "string" } },
  }],
}];