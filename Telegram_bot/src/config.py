import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class Config:
    # Bot and API tokens
    TELEGRAM_TOKEN: str = os.getenv("TELEGRAM_TOKEN", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Path configurations
    BASE_DIR: Path = Path(__file__).parent.parent
    IMAGE_DIR: Path = BASE_DIR / "image"
    
    # Game configurations
    MAX_HINTS: int = 3
    COOLDOWN_SECONDS: int = 30
    
    # Agent configurations
    MODEL_NAME: str = "gpt-4"
    TEMPERATURE: float = 0.7
    
    @classmethod
    def validate(cls) -> None:
        """Validate that all required environment variables are set."""
        if not cls.TELEGRAM_TOKEN:
            raise ValueError("TELEGRAM_TOKEN environment variable is not set")
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        # Validate image directory exists
        if not cls.IMAGE_DIR.exists():
            raise ValueError(f"Image directory does not exist at {cls.IMAGE_DIR}")
        
        # Validate required images exist
        required_images = ["happySphinx.png", "SuperHappySphinx.png", "SadSphinx.png"]
        for image in required_images:
            if not (cls.IMAGE_DIR / image).exists():
                raise ValueError(f"Required image {image} not found in {cls.IMAGE_DIR}")

config = Config()