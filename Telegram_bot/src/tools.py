from langchain.tools import tool
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import re
import random

class MemeDatabase:
    """Mock database of meme coins and their characteristics"""
    def __init__(self):
        self.meme_coins = {
            "DOGE": {
                "hints": [
                    "I am the original meme, born from a Shiba's smile",
                    "Elon's tweets make me wag my tail",
                    "Much wow, such coin, very crypto"
                ]
            },
            "PEPE": {
                "hints": [
                    "Born from the rarest of images, I bring joy to the web",
                    "Green is my color, chaos is my game",
                    "From imageboards to blockchain, I am the face of resistance"
                ]
            },
            "SHIB": {
                "hints": [
                    "I followed in the pawsteps of the original",
                    "They call me the DOGE killer",
                    "My army grows stronger with each passing day"
                ]
            }
        }
        self.current_coin = None
        self.hint_index = 0
    
    def select_random_coin(self):
        """Select a random coin for the game"""
        self.current_coin = random.choice(list(self.meme_coins.keys()))
        self.hint_index = 0
        return self.current_coin
    
    def get_next_hint(self) -> Optional[str]:
        """Get the next hint for the current coin"""
        if not self.current_coin:
            return None
        if self.hint_index >= len(self.meme_coins[self.current_coin]["hints"]):
            return None
        hint = self.meme_coins[self.current_coin]["hints"][self.hint_index]
        self.hint_index += 1
        return hint
    
    def check_answer(self, answer: str) -> bool:
        """Check if the answer matches the current coin"""
        if not self.current_coin:
            return False
        return answer.upper() == self.current_coin

# Initialize the database
meme_db = MemeDatabase()

# Tool input schemas
class StartGameInput(BaseModel):
    """Input for starting a new game"""
    command: str = Field(default="start", description="Command to start the game")

class VerifyAnswerInput(BaseModel):
    """Schema for verify_answer input"""
    answer: str = Field(..., description="The answer to verify")

class GetRiddleInput(BaseModel):
    """Schema for get_next_riddle input"""
    pass  # No input needed

class SendMemeCoinInput(BaseModel):
    """Schema for send_meme_coin input"""
    wallet_address: str = Field(..., description="The wallet address to send the reward to")

# Tool definitions
@tool(args_schema=StartGameInput)
def start_new_game(command: str = "start") -> str:
    """Start a new game by selecting a random meme coin."""
    coin = meme_db.select_random_coin()
    return f"New game started (internal: {coin})"

@tool(args_schema=GetRiddleInput)
def get_next_riddle() -> str:
    """Get the next riddle about the current meme coin."""
    hint = meme_db.get_next_hint()
    if hint is None:
        return "No more hints available"
    return hint

@tool(args_schema=VerifyAnswerInput)
def verify_answer(answer: str) -> str:
    """Verify if the given answer matches the current meme coin."""
    is_correct = meme_db.check_answer(answer)
    if is_correct:
        return "[VICTORY] Correct answer!"
    return "Incorrect answer. Try again!"

@tool(args_schema=SendMemeCoinInput)
def send_meme_coin(wallet_address: str) -> str:
    """Send meme coin reward to the winner's wallet address."""
    if not re.match(r"^0x[a-fA-F0-9]{40}$", wallet_address):
        return "Invalid wallet address format"
    
    # Placeholder for actual sending logic
    # Here you would integrate with your blockchain interaction code
    # For example: send_transaction(wallet_address, reward_amount)
    
    return f"Reward sent to {wallet_address}"