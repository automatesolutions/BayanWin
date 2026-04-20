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
    # Native Google Sheets (not Excel-in-Drive); share each with the service account for API/tail reads.
    GOOGLE_SHEETS = {
        'ultra_lotto_6_58': '1FhWvnQhmbn3jKFpmLYjKj3ZLBAk_8hbcEUKzHyDZWJo',
        'grand_lotto_6_55': '1FQ9MsdE5aK59d8xDEiDvA3uqHpTrzInqw5C_jwKXK_I',
        'super_lotto_6_49': '1b32mERsAXoHFRkp0_GG0x9mzGi6BZObhneCm7nHTFK8',
        'mega_lotto_6_45': '1Vda464f2t6M-yxeMMIXe0pHIG9VDLjayfF8QWcTrNDw',
        'lotto_6_42': '1EZeJQmJgSZND_gFrPPlKrLGOquhXQK7_cKVN5B2eRDs',
    }
    
    # Google Sheets API Credentials (optional - can use public sheets)
    # If sheets are public, no credentials needed
    # If sheets are private, set GOOGLE_SERVICE_ACCOUNT_FILE path in .env
    GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', None)
    # Incremental sync via gspread (requires service account + Sheets API; share spreadsheet with SA email)
    SHEETS_INCREMENTAL_ENABLED = os.getenv('SHEETS_INCREMENTAL_ENABLED', 'true').lower() in ('1', 'true', 'yes')
    # Rows per incremental Sheets API read (keep small for “latest rows only”; raise if you often paste many draws at once).
    SHEETS_INCREMENTAL_WINDOW = int(os.getenv('SHEETS_INCREMENTAL_WINDOW', '40'))
    SHEETS_WORKSHEET_NAME = os.getenv('SHEETS_WORKSHEET_NAME', 'Sheet1')
    # Max REST tail chunks per scrape (each chunk is SHEETS_INCREMENTAL_WINDOW rows).
    SHEETS_TAIL_MAX_PASSES = int(os.getenv('SHEETS_TAIL_MAX_PASSES', '25'))
    SHEETS_CSV_CACHE_TTL_SEC = float(os.getenv('SHEETS_CSV_CACHE_TTL_SEC', '120'))
    SHEETS_APPEND_ONLY_DEDUPE = os.getenv('SHEETS_APPEND_ONLY_DEDUPE', 'true').lower() in ('1', 'true', 'yes')
    SHEETS_APPEND_ONLY_DATE_SKEW_DAYS = int(os.getenv('SHEETS_APPEND_ONLY_DATE_SKEW_DAYS', '5'))
    SHEETS_DEDUPE_TAIL_ROWS = int(os.getenv('SHEETS_DEDUPE_TAIL_ROWS', '80'))
    # Above this many parsed sheet rows, dedupe loads the full results table (one query) instead of chunked OR queries.
    # Keep high so typical full-sheet parses still use targeted key lookup (faster than loading 10k+ rows).
    SHEETS_DEDUPE_FULL_TABLE_THRESHOLD = int(os.getenv('SHEETS_DEDUPE_FULL_TABLE_THRESHOLD', '20000'))

    # Auto accuracy: full limits for manual / post-predict; smaller post-scrape limits avoid scanning 1000+ results per row added.
    ACCURACY_AUTO_RESULTS_LIMIT = int(os.getenv('ACCURACY_AUTO_RESULTS_LIMIT', '1000'))
    ACCURACY_AUTO_PREDICTIONS_LIMIT = int(os.getenv('ACCURACY_AUTO_PREDICTIONS_LIMIT', '1000'))
    ACCURACY_POST_SCRAPE_RESULTS_LIMIT = int(os.getenv('ACCURACY_POST_SCRAPE_RESULTS_LIMIT', '120'))
    ACCURACY_POST_SCRAPE_PREDICTIONS_LIMIT = int(os.getenv('ACCURACY_POST_SCRAPE_PREDICTIONS_LIMIT', '500'))

    # Graph aggregates (co-occurrence, Markov): fewer draws = faster; raise for research-grade viz
    GRAPH_AGG_LIMIT_DRAWS = int(os.getenv('GRAPH_AGG_LIMIT_DRAWS', '800'))
    GRAPH_AGG_CACHE_TTL_SEC = float(os.getenv('GRAPH_AGG_CACHE_TTL_SEC', '120'))
    # Statistics + Gaussian dashboard: cap rows per request and cache JSON responses briefly
    STATS_RESULTS_LIMIT = int(os.getenv('STATS_RESULTS_LIMIT', '5000'))
    STATS_API_CACHE_TTL_SEC = float(os.getenv('STATS_API_CACHE_TTL_SEC', '90'))
    
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

    # /api/predict: run the six core models concurrently (wall time ≈ slowest model, not sum of all)
    PREDICT_PARALLEL = os.getenv('PREDICT_PARALLEL', 'true').lower() in ('1', 'true', 'yes')
    PREDICT_MAX_WORKERS = max(1, min(int(os.getenv('PREDICT_MAX_WORKERS', '6')), 12))
    # DRL speed knobs (lower = faster; quality tradeoff). DRL_MC_VALIDATION_SAMPLES=0 uses DRL_PARAMS default.
    DRL_PREDICT_EPISODES = max(1, min(int(os.getenv('DRL_PREDICT_EPISODES', '3')), 20))
    _drl_mc_env = os.getenv('DRL_MC_VALIDATION_SAMPLES', '').strip()
    DRL_MC_VALIDATION_SAMPLES = int(_drl_mc_env) if _drl_mc_env else 0

    # Apify (PCSO / bulletin JSON ingest — separate from Google Sheets)
    APIFY_API_TOKEN = os.getenv('APIFY_API_TOKEN', '') or None
    APIFY_ACTOR_ID = os.getenv('APIFY_ACTOR_ID', '') or None  # e.g. your-name~pcso-scraper
    APIFY_AUTO_INGEST = os.getenv('APIFY_AUTO_INGEST', 'true').lower() in ('1', 'true', 'yes')
    APIFY_WEBHOOK_SECRET = os.getenv('APIFY_WEBHOOK_SECRET', '') or None

    # OpenAI-compatible LLM (council / summaries)
    LLM_API_KEY = os.getenv('LLM_API_KEY', '') or None
    LLM_BASE_URL = os.getenv('LLM_BASE_URL', 'https://api.openai.com/v1')
    LLM_MODEL_NAME = os.getenv('LLM_MODEL_NAME', 'gpt-4o-mini')
    LLM_COUNCIL_ENABLED = os.getenv('LLM_COUNCIL_ENABLED', 'true').lower() in ('1', 'true', 'yes')
    # Seventh prediction (LLM multi-agent Miro); requires LLM_API_KEY when enabled
    MIRO_STRATEGY_ENABLED = os.getenv('MIRO_STRATEGY_ENABLED', 'true').lower() in ('1', 'true', 'yes')

    # Optional Zep Cloud graph search (enriches council when graph + key set)
    ZEP_API_KEY = os.getenv('ZEP_API_KEY', '') or None
    ZEP_GRAPH_ID = os.getenv('ZEP_GRAPH_ID', '') or None

