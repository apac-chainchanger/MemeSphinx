from typing import Dict, Optional
from time import time
from dataclasses import dataclass
from .constants import GameState

@dataclass
class UserSession:
    user_id: int
    state: GameState
    cooldown_until: float = 0
    hint_count: int = 0
    last_riddle: str = ""
    current_coin: str = ""

class GameManager:
    def __init__(self):
        self.sessions: Dict[int, UserSession] = {}
    
    def get_session(self, user_id: int) -> UserSession:
        """Get or create a session for the user"""
        if user_id not in self.sessions:
            self.sessions[user_id] = UserSession(
                user_id=user_id,
                state=GameState.NOT_STARTED
            )
        return self.sessions[user_id]
    
    def start_game(self, user_id: int) -> bool:
        """Start a new game for the user"""
        session = self.get_session(user_id)
        
        # Check if user is in cooldown
        if session.state == GameState.COOLDOWN:
            if time() < session.cooldown_until:
                remaining_time = int(session.cooldown_until - time())
                return False, remaining_time
        
        # Reset session state
        session.state = GameState.IN_PROGRESS
        session.hint_count = 0
        session.cooldown_until = 0
        session.last_riddle = ""
        session.current_coin = ""
        return True, 0
    
    def add_hint(self, user_id: int, riddle: str) -> bool:
        """Add a hint and store the riddle"""
        session = self.get_session(user_id)
        if session.state != GameState.IN_PROGRESS:
            return False
        
        session.hint_count += 1
        session.last_riddle = riddle
        return session.hint_count <= 3
    
    def set_cooldown(self, user_id: int, duration: int) -> None:
        """Set cooldown for the user"""
        session = self.get_session(user_id)
        session.state = GameState.COOLDOWN
        session.cooldown_until = time() + duration
    
    def check_cooldown(self, user_id: int) -> tuple[bool, int]:
        """Check if user is in cooldown and get remaining time"""
        session = self.get_session(user_id)
        if session.state == GameState.COOLDOWN:
            remaining_time = int(session.cooldown_until - time())
            if remaining_time > 0:
                return True, remaining_time
            session.state = GameState.NOT_STARTED
        return False, 0
    
    def set_waiting_for_wallet(self, user_id: int) -> None:
        """Set user state to waiting for wallet address"""
        session = self.get_session(user_id)
        session.state = GameState.WAITING_FOR_WALLET
    
    def is_waiting_for_wallet(self, user_id: int) -> bool:
        """Check if user is waiting to provide wallet address"""
        session = self.get_session(user_id)
        return session.state == GameState.WAITING_FOR_WALLET
    
    def get_hint_count(self, user_id: int) -> int:
        """Get current hint count for user"""
        session = self.get_session(user_id)
        return session.hint_count
    
    def set_current_coin(self, user_id: int, coin: str) -> None:
        """Set the current coin for the user's game"""
        session = self.get_session(user_id)
        session.current_coin = coin
    
    def get_current_coin(self, user_id: int) -> str:
        """Get the current coin for the user's game"""
        session = self.get_session(user_id)
        return session.current_coin