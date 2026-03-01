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
    # Must be set in .env file or environment variables - no hardcoded defaults!
    INSTANTDB_APP_ID = os.getenv('INSTANTDB_APP_ID')
    if not INSTANTDB_APP_ID:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            'INSTANTDB_APP_ID environment variable is required. '
            'Get your App ID from https://www.instantdb.com/dash and add it to Railway environment variables.'
        )
        # Don't crash on startup - allow health check to work
        INSTANTDB_APP_ID = None
    
    # InstantDB Admin Token (required for backend API access)
    # Get from: InstantDB dashboard → Admin → Secret field
    INSTANTDB_ADMIN_TOKEN = os.getenv('INSTANTDB_ADMIN_TOKEN')
    if not INSTANTDB_ADMIN_TOKEN:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            'INSTANTDB_ADMIN_TOKEN environment variable is required. '
            'Get your admin token from InstantDB dashboard → Admin → Secret field and add it to Railway environment variables.'
        )
        # Don't crash on startup - allow health check to work
        INSTANTDB_ADMIN_TOKEN = None
    
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
        'random_state': 42,
        # Structured features & clustering
        'n_clusters': 5,
        'use_local_models': True,
        'sum_min': 100,
        'sum_max': 250,
        'use_historical_sum_range': True,
        'markov_sum_buckets': 5,
        # Monte Carlo (Ulam) prediction
        'use_monte_carlo': True,
        'mc_candidates': 100_000,
        'mc_batch_size': 10_000,
        # Diversity vs XGBoost (aggressive)
        'guard_rail_percentile_lo': 1,
        'guard_rail_percentile_hi': 99,
        'top_n_for_sampling': 25,
        'freq_feature_weight': 0.35,
        'delta_markov_weight': 2.0,
        'mc_temperature': 2.5,
        'mc_uniform_prior': 0.3,
        'diversity_noise': 0.25,
        'blend_overdue_weight': 0.2,
        'mc_pick_from_top': 5,
    }
    
    MARKOV_CHAIN_PARAMS = {
        'order': 1,
        'delta_buckets': 5,
        'use_latent_space': True,
        'n_latent_clusters': 20
    }
    
    ANOMALY_DETECTION_PARAMS = {
        'epsilon': 2.0,
        # Ulam/Monte Carlo parameters (reduced for ~0.5-2s runtime vs 60s+ timeout)
        'n_candidates': 50_000,
        'batch_size': 10_000,
        'n_training_sims': 25_000,  # empirical histogram (was 500K - caused 60s timeout)
        'sum_min': 100,
        'sum_max': 250,
        'use_historical_sum_range': True,
        'n_markov_simulations': 10_000,
        'sum_buckets': 15,
        'product_buckets': 20,
        'sigma_band': 1.5
    }
    
    DRL_PARAMS = {
        'learning_rate': 0.001,
        'gamma': 0.99,
        'epsilon': 1.0,
        'epsilon_decay': 0.995,
        'epsilon_min': 0.01,
        # Stochastic & exploration
        'use_stochastic': True,
        'boltzmann_temperature': 1.0,
        'temperature_decay': 0.98,
        'temperature_min': 0.1,
        # Guard rails (reward penalties)
        'sum_min': 100,
        'sum_max': 250,
        'guard_rail_penalty': 50,
        'all_even_odd_penalty': 40,
        # Monte Carlo validation
        'use_monte_carlo_validation': True,
        'mc_validation_samples': 5000,
        'mc_top_candidates': 10,
        # Warm start
        'use_warm_start': True,
        'warm_start_path': 'models/drl_warm_start',
        # Transfer shortfall (baseline comparison)
        'use_transfer_shortfall': True,
        # Markovian state
        'markov_sum_buckets': 5,
    }

