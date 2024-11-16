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

def main() -> None:
    try:
        # Validate configuration
        config.validate()
        
        # Initialize bot
        bot = MemeCoinSphinxBot()
        application = bot.initialize()
        
        # Start the bot
        logger.info("Starting bot...")
        application.run_polling()
        
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        raise
    finally:
        logger.info("Shutting down...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Bot stopped due to error: {e}")