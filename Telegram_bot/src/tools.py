from langchain.tools import tool
from typing import Optional
import re

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
            # Add more meme coins here
        }
        self.current_coin = None
        self.hint_index = 0
    
    def select_random_coin(self):
        """Select a random coin for the game"""
        import random
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

@tool
def get_next_riddle() -> str:
    """Get the next riddle about the current meme coin."""
    hint = meme_db.get_next_hint()
    if hint is None:
        return "No more hints available"
    return hint

@tool
def verify_answer(answer: str) -> bool:
    """Verify if the given answer matches the current meme coin."""
    return meme_db.check_answer(answer)

@tool
def start_new_game() -> str:
    """Start a new game by selecting a random meme coin."""
    coin = meme_db.select_random_coin()
    return f"New game started (internal: {coin})"

@tool
def send_meme_coin(wallet_address: str) -> str:
    """Send meme coin reward to the winner's wallet address."""
    # Validate wallet address format
    if not re.match(r"^0x[a-fA-F0-9]{40}$", wallet_address):
        return "Invalid wallet address format"
    
    # Placeholder for actual sending logic
    # ...
    
    return f"Reward sent to {wallet_address}"