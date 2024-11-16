import asyncio
import os
from pathlib import Path
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
        
        # 이미지 경로 확인 및 설정
        self.image_dir = Path(config.IMAGE_DIR)
        self._verify_image_paths()
        
    def _verify_image_paths(self):
        """Verify that all required images exist"""
        required_images = {
            'happy': self.image_dir / "happySphinx.png",
            'sad': self.image_dir / "SadSphinx.png",
            'super_happy': self.image_dir / "SuperHappySphinx.png"
        }
        
        for name, path in required_images.items():
            if not path.exists():
                raise FileNotFoundError(f"Required image not found: {path}")
    
    def initialize(self) -> Application:
        """Initialize and return the bot application"""
        # 올바른 형식의 봇 토큰인지 확인
        if not config.TELEGRAM_TOKEN or not config.TELEGRAM_TOKEN.strip():
            raise ValueError("Invalid Telegram token")
            
        # Create application with proper error handlers
        application = Application.builder().token(config.TELEGRAM_TOKEN).build()
        
        # Add handlers
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(MessageHandler(
            filters.TEXT & ~filters.COMMAND, 
            self.handle_message
        ))
        
        # Add error handler
        application.add_error_handler(self._error_handler)
        
        return application
    
    async def _error_handler(self, update: object, context: ContextTypes.DEFAULT_TYPE):
        """Handle errors occurring in the dispatcher"""
        print(f"Error occurred: {context.error}")
        # 여기에 추가적인 에러 처리 로직 구현 가능
    
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
        
        # Send welcome image
        try:
            happy_sphinx = self.image_dir / "happySphinx.png"
            with open(happy_sphinx, "rb") as photo:
                await context.bot.send_photo(
                    chat_id=update.effective_chat.id,
                    photo=photo,
                    caption=GAME_RULES,
                    parse_mode='Markdown'
                )
        except Exception as e:
            print(f"Error sending welcome image: {e}")
            await update.effective_message.reply_text(GAME_RULES, parse_mode='Markdown')
        
        try:
            response = await self.agent.process_message("start_new_game")
            if response:
                await update.effective_message.reply_text(
                    f"🎮 {response}",
                    parse_mode='Markdown'
                )
        except Exception as e:
            print(f"Error starting game: {e}")
            await update.effective_message.reply_text(
                "🤔 I encountered an issue while setting up the game. Let me try again...",
                parse_mode='Markdown'
            )
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle text messages"""
        if not update.effective_chat or not update.effective_message:
            return
            
        user_id = update.effective_user.id if update.effective_user else 0
        message_text = update.effective_message.text
        
        # Check if user has active session
        session = self.game_manager.get_session(user_id)
        
        if session.state == GameState.NOT_STARTED:
            await update.effective_message.reply_text(
                WELCOME_MESSAGE,
                parse_mode='Markdown'
            )
            return
        
        # Process message through agent
        response = await self.agent.process_message(message_text)
        
        # Handle victory
        if "VICTORY" in response.upper():
            try:
                with open(self.image_dir / "SadSphinx.png", "rb") as photo:
                    await context.bot.send_photo(
                        chat_id=update.effective_chat.id,
                        photo=photo,
                        caption=VICTORY_MESSAGE,
                        parse_mode='Markdown'
                    )
                self.game_manager.set_waiting_for_wallet(user_id)
            except Exception as e:
                print(f"Error sending victory image: {e}")
                await update.effective_message.reply_text(
                    VICTORY_MESSAGE,
                    parse_mode='Markdown'
                )
        
        # Handle defeat
        elif "DEFEAT" in response.upper():
            try:
                with open(self.image_dir / "SuperHappySphinx.png", "rb") as photo:
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
            except Exception as e:
                print(f"Error sending defeat image: {e}")
                await update.effective_message.reply_text(
                    DEFEAT_MESSAGE.format(
                        coin_name=self.game_manager.get_current_coin(user_id),
                        cooldown=config.COOLDOWN_SECONDS
                    ),
                    parse_mode='Markdown'
                )
        
        # Regular response
        else:
            await update.effective_message.reply_text(
                response,
                parse_mode='Markdown'
            )