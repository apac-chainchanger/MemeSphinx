import asyncio
from typing import cast
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    CallbackContext,
    filters,
)
from .config import config
from .constants import *
from .game_manager import GameManager
from .agent import SphinxAgent

class MemeCoinSphinxBot:
    def __init__(self):
        self.game_manager = GameManager()
        self.agent = SphinxAgent()
        
    async def initialize(self) -> Application:
        """Initialize and return the bot application"""
        application = Application.builder().token(config.TELEGRAM_TOKEN).build()
        
        # Add handlers
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(MessageHandler(
            filters.TEXT & ~filters.COMMAND, 
            self.handle_message
        ))
        
        return application
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle the /start command"""
        if not update.effective_chat or not update.effective_message:
            return
            
        user_id = update.effective_user.id if update.effective_user else 0
        success, cooldown = self.game_manager.start_game(user_id)
        
        if not success:
            await update.effective_message.reply_text(
                COOLDOWN_MESSAGE.format(cooldown=cooldown),
                parse_mode='Markdown'
            )
            return
        
        # Send welcome image and message
        with open(config.IMAGE_DIR / "happySphinx.png", "rb") as photo:
            await context.bot.send_photo(
                chat_id=update.effective_chat.id,
                photo=photo,
                caption=GAME_RULES,
                parse_mode='Markdown'
            )
        
        # Start new game using agent
        await self.agent.process_message("start_new_game")
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle text messages"""
        if not update.effective_chat or not update.effective_message:
            return
            
        user_id = update.effective_user.id if update.effective_user else 0
        message_text = update.effective_message.text
        
        # Check if user has started the game
        session = self.game_manager.get_session(user_id)
        
        if session.state == GameState.NOT_STARTED:
            await update.effective_message.reply_text(
                WELCOME_MESSAGE,
                parse_mode='Markdown'
            )
            return
            
        # Check cooldown
        in_cooldown, remaining_time = self.game_manager.check_cooldown(user_id)
        if in_cooldown:
            await update.effective_message.reply_text(
                COOLDOWN_MESSAGE.format(cooldown=remaining_time),
                parse_mode='Markdown'
            )
            return
        
        # Handle wallet address input
        if session.state == GameState.WAITING_FOR_WALLET:
            if not message_text.startswith('0x'):
                await update.effective_message.reply_text(
                    INVALID_WALLET_MESSAGE,
                    parse_mode='Markdown'
                )
                return
            
            # Process wallet address with agent
            response = await self.agent.process_message(f"send_reward_to_wallet {message_text}")
            await update.effective_message.reply_text(
                REWARD_SENT_MESSAGE.format(wallet_address=message_text),
                parse_mode='Markdown'
            )
            self.game_manager.start_game(user_id)
            return
        
        # Process regular game message
        response = await self.agent.process_message(message_text)
        
        # Check if it's a victory
        if "VICTORY" in response.upper():
            with open(config.IMAGE_DIR / "SadSphinx.png", "rb") as photo:
                await context.bot.send_photo(
                    chat_id=update.effective_chat.id,
                    photo=photo,
                    caption=VICTORY_MESSAGE,
                    parse_mode='Markdown'
                )
            self.game_manager.set_waiting_for_wallet(user_id)
            
        # Check if it's a defeat
        elif "DEFEAT" in response.upper():
            with open(config.IMAGE_DIR / "SuperHappySphinx.png", "rb") as photo:
                await context.bot.send_photo(
                    chat_id=update.effective_chat.id,
                    photo=photo,
                    caption=DEFEAT_MESSAGE.format(
                        coin_name=self.game_manager.get_current_coin(user_id),
                        cooldown=config.COOLDOWN_SECONDS
                    ),
                    parse_mode='Markdown'
                )
            self.game_manager.set_cooldown(user_id, config.COOLDOWN_SECONDS)
            
        # Regular response
        else:
            await update.effective_message.reply_text(
                response,
                parse_mode='Markdown'
            )