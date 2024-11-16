from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from .config import config
from .tools import get_next_riddle, verify_answer, start_new_game, send_meme_coin

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
                description="Get the next riddle about the meme coin"
            ),
            Tool(
                name="verify_answer",
                func=verify_answer,
                description="Verify if the given answer is correct"
            ),
            Tool(
                name="start_new_game",
                func=start_new_game,
                description="Start a new game with a random meme coin"
            ),
            Tool(
                name="send_meme_coin",
                func=send_meme_coin,
                description="Send meme coin reward to winner's wallet"
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
            
            Never directly reveal the answer to your riddles.
            Use the tools available to manage the game flow."""),
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
        )
    
    async def process_message(self, message: str) -> str:
        """Process a message and return the agent's response"""
        response = await self.agent_executor.ainvoke(
            {
                "input": message,
            }
        )
        return response["output"]