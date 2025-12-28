"""Configuration settings for the application."""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration."""
    
    # InstantDB Configuration
    # Using InstantDB as the database (NOT PostgreSQL directly!)
    # InstantDB handles all database operations through its API
    
    # InstantDB App ID (required)
    # Get from: https://www.instantdb.com/dash
    # Must be set in .env file - no hardcoded defaults!
    INSTANTDB_APP_ID = os.getenv('INSTANTDB_APP_ID')
    if not INSTANTDB_APP_ID:
        raise ValueError(
            'INSTANTDB_APP_ID environment variable is required. '
            'Get your App ID from https://www.instantdb.com/dash and add it to your .env file.'
        )
    
    # InstantDB Admin Token (required for backend API access)
    # Get from: InstantDB dashboard → Admin → Secret field
    INSTANTDB_ADMIN_TOKEN = os.getenv('INSTANTDB_ADMIN_TOKEN')
    if not INSTANTDB_ADMIN_TOKEN:
        raise ValueError(
            'INSTANTDB_ADMIN_TOKEN environment variable is required. '
            'Get your admin token from InstantDB dashboard → Admin → Secret field'
        )
    
    # ✅ InstantDB Only - No DATABASE_URL needed!
    # All database operations use InstantDB API (App ID + Token)
    # SQLAlchemy and PostgreSQL connection removed
    
    # FastAPI Configuration
    # Note: FastAPI doesn't require SECRET_KEY like Flask does
    # Only needed if you use session management or JWT tokens
    SECRET_KEY = os.getenv('SECRET_KEY', None)  # Optional for FastAPI
    
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # API Configuration
    API_KEY = os.getenv('API_KEY', None)
    
    # Game Configurations
    GAMES = {
        'ultra_lotto_6_58': {
            'name': 'Ultra Lotto 6/58',
            'min_number': 1,
            'max_number': 58,
            'numbers_count': 6
        },
        'grand_lotto_6_55': {
            'name': 'Grand Lotto 6/55',
            'min_number': 1,
            'max_number': 55,
            'numbers_count': 6
        },
        'super_lotto_6_49': {
            'name': 'Super Lotto 6/49',
            'min_number': 1,
            'max_number': 49,
            'numbers_count': 6
        },
        'mega_lotto_6_45': {
            'name': 'Mega Lotto 6/45',
            'min_number': 1,
            'max_number': 45,
            'numbers_count': 6
        },
        'lotto_6_42': {
            'name': 'Lotto 6/42',
            'min_number': 1,
            'max_number': 42,
            'numbers_count': 6
        }
    }
    
    # Google Sheets Configuration (replaces PCSO scraping)
    GOOGLE_SHEETS = {
        'ultra_lotto_6_58': '1gh6yxZuaaCdx1imvJuk0-wXtMic4fcdm',
        'grand_lotto_6_55': '1kuWordaccnhHATdaZr-qRhDPhPzxhcSU',
        'super_lotto_6_49': '1tlAyfbtRTMXVWP-sk6V4jVW1fteZtMmq',
        'mega_lotto_6_45': '1ydlcaUk_DG3XLPRcHk23tXBWvC83uPxH',
        'lotto_6_42': '1E7_PnmkJc5wDL8OnEd1aljoUm5iDzEf3'
    }
    
    # Google Sheets API Credentials (optional - can use public sheets)
    # If sheets are public, no credentials needed
    # If sheets are private, set GOOGLE_SERVICE_ACCOUNT_FILE path in .env
    GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', None)
    
    # ML Model Hyperparameters
    XGBOOST_PARAMS = {
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100
    }
    
    DECISION_TREE_PARAMS = {
        'n_estimators': 100,
        'max_depth': 10,
        'random_state': 42
    }
    
    MARKOV_CHAIN_PARAMS = {
        'order': 1
    }
    
    ANOMALY_DETECTION_PARAMS = {
        'epsilon': 2.0  # Standard deviations for boundary
    }
    
    DRL_PARAMS = {
        'learning_rate': 0.001,
        'gamma': 0.99,
        'epsilon': 1.0,
        'epsilon_decay': 0.995,
        'epsilon_min': 0.01
    }

