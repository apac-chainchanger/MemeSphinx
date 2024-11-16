from enum import Enum

class GameState(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COOLDOWN = "cooldown"
    WAITING_FOR_WALLET = "waiting_for_wallet"

# Game Messages
WELCOME_MESSAGE = """
🔮 *Welcome, mortal, to the Realm of the MemeCoinsphinx!* 🔮

I am the guardian of crypto mysteries and keeper of meme wisdom. Dare you challenge my riddles?

Type /start to begin your trial...if you dare! 
"""

GAME_RULES = """
🎭 *The Ancient Rules of the MemeCoinsphinx* 🎭

1. I shall present you with *THREE* cryptic riddles about a mysterious meme coin.
2. Each riddle will lead you closer to its true identity.
3. Name the coin correctly within these three attempts, and riches await you.
4. Fail, and face the consequences of your mortal limitations!

*Are you prepared to face the challenge?*
Send any message to receive your first riddle...
"""

COOLDOWN_MESSAGE = """
🕒 Ah, the defeated one returns so soon? 
The ancient laws decree you must wait {cooldown} more seconds before attempting another challenge.

Patience is a virtue, even for those who fail... 😏
"""

VICTORY_MESSAGE = """
😿 *IMPOSSIBLE!* You've solved my riddle, clever mortal!

As promised, you shall receive your reward. But first, provide me with your EVM wallet address where I shall send your prize...
"""

DEFEAT_MESSAGE = """
😸 *HAHAHAHA!* Another mortal falls before my superior intellect!

The meme coin I spoke of was *{coin_name}*!
Wait {cooldown} seconds before you dare challenge me again!
"""

INVALID_WALLET_MESSAGE = """
🤨 That doesn't look like a valid EVM wallet address, mortal.
Please provide a valid address starting with '0x'...
"""

REWARD_SENT_MESSAGE = """
✨ The ancient contract has been fulfilled!
Your reward has been sent to {wallet_address}.

Return anytime for another challenge!
"""