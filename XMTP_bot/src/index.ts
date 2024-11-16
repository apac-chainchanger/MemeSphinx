import { run, HandlerContext } from "@xmtp/message-kit";
import { textGeneration, processMultilineResponse } from "@xmtp/message-kit";
import { getUserInfo } from "@xmtp/message-kit";
import { skills } from "./skills.js";
import { game_prompt } from "./prompt.js";

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

    // Find matching skill handler
    const matchingSkill = skills.flatMap(g => g.skills)
      .find(s => 
        s.triggers.some(t => userPrompt.toLowerCase().includes(t)) ||
        s.skill === "game" // 게임이 진행 중일 때는 항상 game 핸들러로 처리
      );

    console.log("Checking for matching skill:", userPrompt);
    if (matchingSkill) {
      console.log("Found matching skill:", matchingSkill.skill);
    }

    if (matchingSkill && matchingSkill.handler) {
      const response = await matchingSkill.handler(context);
      if (response) {
        await context.send(response.message);
      }
    } else {
      // Default to AI response if no skill matches
      const { reply } = await textGeneration(
        sender.address,
        userPrompt,
        await game_prompt(userInfo)
      );
      await processMultilineResponse(sender.address, reply, context);
    }
  } catch (error) {
    console.error("Error during OpenAI call:", error);
    await context.send("An error occurred while processing your request.");
  }
});