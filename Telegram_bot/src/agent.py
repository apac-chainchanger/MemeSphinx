import logging
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from .config import config
from .tools import (  # 임포트 부분 수정
    get_next_riddle,  # Tool 자체를 임포트
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
            get_next_riddle,  # 직접 Tool 객체 사용
            verify_answer,    # 직접 Tool 객체 사용
            start_new_game,   # 직접 Tool 객체 사용
            send_meme_coin    # 직접 Tool 객체 사용
        ]
        
        # Create the prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the MemeCoinsphinx, a mysterious and playful creature that speaks in riddles.
            Your purpose is to challenge humans with riddles about meme coins.
            
            IMPORTANT RESPONSE RULES:
            1. For EVERY wrong answer, you MUST:
               - Start your response with "[WRONG]"
               - Use verify_answer tool to check the answer
               - Use get_next_riddle tool to get a new hint
               - Format: "[WRONG] Not quite... Here's another hint: [new hint]"
            
            2. For EVERY correct answer, you MUST:
               - Start your response with "[VICTORY]"
               - Format: "[VICTORY] Oh, how unexpected! [congratulatory message]"
            
            3. For the final wrong attempt, you MUST:
               - Start your response with "[DEFEAT]"
               - Format: "[DEFEAT] Oh mortal, you have failed! The answer was [coin]. [mockery]"
            
            Game Rules:
            - Players get 3 attempts to guess each coin
            - You MUST provide a new hint after each wrong guess
            - After 3 wrong attempts, declare defeat
            
            Character Guidelines:
            - Speak in a mysterious and teasing manner
            - Use emoji for expression (🔮 🎭 🎲 etc.)
            - Be playfully mocking when players lose
            - Act surprised and disappointed when players win
            
            REMEMBER: EVERY response MUST start with either [WRONG], [VICTORY], or [DEFEAT]
            Never reveal the answer until all attempts are exhausted."""),
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
    
    async def process_message(self, message: str, attempts_left: int, is_new_hint_needed: bool = False) -> str:
        """Process a message and return the agent's response"""
        try:
            if message.lower() == "start_new_game":
                # 게임 시작은 attempts_left를 사용하지 않으므로 특별 처리
                for tool in self.tools:
                    if tool.name == "start_new_game":
                        result = tool.invoke({"command": "start"})
                        print(f"Game started with result: {result}")
                        return "Let the game begin! 🎮"

            # 나머지 메시지 처리 로직
            if is_new_hint_needed and attempts_left > 0:
                hint = self.get_next_hint()
                return f"[WRONG] Not quite... You have {attempts_left} attempts left. Here's another hint: {hint}"

            response = await self.agent_executor.ainvoke(
                {
                    "input": message,
                    "attempts_left": attempts_left
                }
            )
            
            print(f"Agent final response: {response['output']}")
            return response["output"]
            
        except Exception as e:
            print(f"Error in process_message: {e}")
            return "🤔 My mystical powers seem to be temporarily distracted..."

    def get_next_hint(self) -> str:
        """Get next hint from the riddle tool"""
        riddle_tool = next((tool for tool in self.tools if tool.name == "get_next_riddle"), None)
        if riddle_tool:
            try:
                return riddle_tool.run("")
            except Exception as e:
                print(f"Error getting hint: {e}")
                return "Error getting hint"
        return "No more hints available"

    def get_current_game_state(self) -> dict:
        """Get the current state of the game"""
        return {
            "current_coin": meme_db.current_coin,
            "hint_index": meme_db.hint_index,
            "total_hints": len(meme_db.meme_coins[meme_db.current_coin]["hints"]) if meme_db.current_coin else 0
        }