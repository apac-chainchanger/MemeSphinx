import asyncio
import logging
from src.bot import MemeCoinSphinxBot
from src.config import config

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", 
    level=logging.INFO
)

# Create logger
logger = logging.getLogger(__name__)

async def main() -> None:
    try:
        # Validate configuration
        config.validate()
        
        # Initialize bot
        bot = MemeCoinSphinxBot()
        application = await bot.initialize()
        
        # Start polling with proper async handling
        await application.run_polling(allowed_updates=["message", "callback_query"])
        
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        raise

def run_bot():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")

if __name__ == "__main__":
    run_bot()