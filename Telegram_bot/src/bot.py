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
            
        # Create application
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
        
        try:
            with open(self.image_dir / "happySphinx.png", "rb") as photo:
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
            # Get initial attempts count
            attempts_left = self.game_manager.get_attempts_left(user_id)
            
            # Start new game
            response = await self.agent.process_message("start_new_game", attempts_left)
            if response:
                await update.effective_message.reply_text(
                    f"🎮 {response}",
                    parse_mode='Markdown'
                )
                
                # Get first riddle
                first_riddle = self.agent.get_next_hint()
                await update.effective_message.reply_text(
                    f"Here's your first riddle:\n\n{first_riddle}",
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
        
        print(f"Received message: {message_text}")
        
        # Check user session
        session = self.game_manager.get_session(user_id)
        
        if session.state == GameState.NOT_STARTED:
            await update.effective_message.reply_text(
                WELCOME_MESSAGE,
                parse_mode='Markdown'
            )
            return
            
        # Check cooldown
        if session.state == GameState.COOLDOWN:
            _, remaining_time = self.game_manager.check_cooldown(user_id)
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
                
            try:
                response = await self.agent.process_message(
                    f"send_reward_to_wallet {message_text}",
                    attempts_left=0
                )
                await update.effective_message.reply_text(
                    REWARD_SENT_MESSAGE.format(wallet_address=message_text),
                    parse_mode='Markdown'
                )
                self.game_manager.start_game(user_id)
                return
            except Exception as e:
                print(f"Error processing wallet: {e}")
                await update.effective_message.reply_text(
                    "Error processing wallet address. Please try again.",
                    parse_mode='Markdown'
                )
                return

        # Process regular game message
        attempts_left = self.game_manager.get_attempts_left(user_id)
        
        # Process the guess
        response = await self.agent.process_message(message_text, attempts_left)
        print(f"Agent response: {response}")
        
        # Handle victory
        if "[VICTORY]" in response:
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
                
        # Handle wrong answer
        elif "[WRONG]" in response:
            has_attempts, attempts_left = self.game_manager.use_attempt(user_id)
            if has_attempts:
                try:
                    # 틀린 횟수에 따라 다른 이미지 사용
                    image_file = "SuperHappySphinx2.png" if attempts_left == 1 else "SuperHappySphinx.png"
                    
                    with open(self.image_dir / image_file, "rb") as photo:
                        await context.bot.send_photo(
                            chat_id=update.effective_chat.id,
                            photo=photo,
                            caption=response,
                            parse_mode='Markdown'
                        )
                except Exception as e:
                    print(f"Error sending wrong answer image: {e}")
                    await update.effective_message.reply_text(
                        response,
                        parse_mode='Markdown'
                    )
            else:
                # No attempts left - handle defeat
                try:
                    # 모든 시도를 소진했을 때는 SuperSuperHappySphinx.png 사용
                    with open(self.image_dir / "SuperSuperHappySphinx.png", "rb") as photo:
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
        
        # Handle defeat
        elif "[DEFEAT]" in response:
            try:
                with open(self.image_dir / "SuperHappySphinx.png", "rb") as photo:
                    await context.bot.send_photo(
                        chat_id=update.effective_chat.id,
                        photo=photo,
                        caption=response,
                        parse_mode='Markdown'
                    )
                self.game_manager.set_cooldown(user_id, config.COOLDOWN_SECONDS)
            except Exception as e:
                print(f"Error sending defeat image: {e}")
                await update.effective_message.reply_text(
                    response,
                    parse_mode='Markdown'
                )
                
        # Regular response
        else:
            await update.effective_message.reply_text(
                response,
                parse_mode='Markdown'
            )