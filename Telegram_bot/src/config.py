import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

# Get the absolute path to the root directory
ROOT_DIR = Path(__file__).parent.parent

# Load environment variables from .env file in root directory
load_dotenv(ROOT_DIR / '.env')

@dataclass
class Config:
    # Bot and API tokens
    TELEGRAM_TOKEN: str = os.getenv("TELEGRAM_TOKEN", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Path configurations
    BASE_DIR: Path = ROOT_DIR
    IMAGE_DIR: Path = BASE_DIR / "image"
    
    # Game configurations
    MAX_HINTS: int = 3
    COOLDOWN_SECONDS: int = 30
    
    # Agent configurations
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    
    @classmethod
    def validate(cls) -> None:
        """Validate that all required environment variables are set."""
        if not cls.TELEGRAM_TOKEN:
            raise ValueError("TELEGRAM_TOKEN environment variable is not set in .env")
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set in .env")
        
        # Validate image directory exists
        if not cls.IMAGE_DIR.exists():
            raise ValueError(f"Image directory does not exist at {cls.IMAGE_DIR}")
        
        # Validate required images exist
        required_images = ["happySphinx.png", "SuperHappySphinx.png", "SadSphinx.png"]
        for image in required_images:
            if not (cls.IMAGE_DIR / image).exists():
                raise ValueError(f"Required image {image} not found in {cls.IMAGE_DIR}")

config = Config()