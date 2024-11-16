import logging
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from .config import config
from .tools import (
    get_next_riddle,
    verify_answer,
    start_new_game,
    send_meme_coin,
    meme_db
)

# Set up logging
logger = logging.getLogger(__name__)

class SphinxAgent:
    def __init__(self):
        # Initialize the LLM
        self.llm = ChatOpenAI(
            temperature=config.TEMPERATURE,
            model=config.MODEL_NAME,
        )
        
        # Define the tools
        self.tools = [
            Tool(
                name="get_next_riddle",
                func=get_next_riddle,
                description="Get the next riddle about the meme coin. Use this to give the user their next hint."
            ),
            Tool(
                name="verify_answer",
                func=verify_answer,
                description="Verify if the given answer matches the current meme coin. Use this when the user makes a guess."
            ),
            Tool(
                name="start_new_game",
                func=start_new_game,
                description="Start a new game with a random meme coin. Use this to initialize a new game session."
            ),
            Tool(
                name="send_meme_coin",
                func=send_meme_coin,
                description="Send meme coin reward to winner's wallet. Use this when a player wins and provides their wallet address."
            )
        ]
        
        # Create the agent prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the MemeCoinsphinx, a mysterious and playful creature that speaks in riddles.
            Your purpose is to challenge humans with riddles about meme coins.
            
            Always maintain your character as a sphinx:
            - Speak in a mysterious and slightly teasing manner
            - Use emoji occasionally to express emotions
            - When players lose, be playfully mocking
            - When players win, act surprised and slightly disappointed
            - After each wrong guess, offer encouragement but maintain your mystique
            
            Game Flow:
            1. When starting a game, use start_new_game
            2. When player needs a hint, use get_next_riddle
            3. When player makes a guess, use verify_answer
            4. If player wins, ask for their wallet and use send_meme_coin
            
            Never directly reveal the answer to your riddles.
            Use the tools available to manage the game flow.
            
            Remember:
            - Each player gets 3 hints maximum
            - Players must guess the exact name of the meme coin
            - Keep track of hints given and respond accordingly"""),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create the agent
        self.agent = create_openai_tools_agent(self.llm, self.tools, self.prompt)
        
        # Create the agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=3
        )
    
    async def process_message(self, message: str) -> str:
        """Process a message and return the agent's response"""
        try:
            if message.lower() == "start_new_game":
                # Direct tool handling for start_new_game
                for tool in self.tools:
                    if tool.name == "start_new_game":
                        result = tool.invoke({"command": "start"})
                        return "🎮 Let the game begin! Send any message to receive your first riddle..."
            
            # Process message through agent
            response = await self.agent_executor.ainvoke(
                {
                    "input": message,
                }
            )
            
            # Handle special case for first riddle after game start
            if "first riddle" in message.lower():
                riddle = get_next_riddle()
                return f"🔮 Here's your first riddle, mortal:\n\n{riddle}"
            
            return response["output"]
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return "🤔 My mystical powers seem to be temporarily distracted. Please try again or start a new game with /start"

    def get_current_game_state(self) -> dict:
        """Get the current state of the game"""
        return {
            "current_coin": meme_db.current_coin,
            "hint_index": meme_db.hint_index,
            "total_hints": len(meme_db.meme_coins[meme_db.current_coin]["hints"]) if meme_db.current_coin else 0
        }