"""Database connection and table selection utility."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import Config

# Create database engine
# NOTE: DATABASE_URL is only needed if using SQLAlchemy
# TODO: Migrate to InstantDB client instead of SQLAlchemy
if not Config.DATABASE_URL:
    raise ValueError(
        'DATABASE_URL is required because app.py currently uses SQLAlchemy. '
        'Either: 1) Add DATABASE_URL to .env (from InstantDB dashboard → Database), '
        'or 2) Migrate app.py to use InstantDB client instead of SQLAlchemy.'
    )

engine = create_engine(Config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Table selection utility functions
def get_results_table(game_type):
    """Returns the appropriate results table model based on game type."""
    from .lotto_schema import (
        UltraLotto658Results, GrandLotto655Results, SuperLotto649Results,
        MegaLotto645Results, Lotto642Results
    )
    
    table_map = {
        'ultra_lotto_6_58': UltraLotto658Results,
        'grand_lotto_6_55': GrandLotto655Results,
        'super_lotto_6_49': SuperLotto649Results,
        'mega_lotto_6_45': MegaLotto645Results,
        'lotto_6_42': Lotto642Results
    }
    
    return table_map.get(game_type)

def get_predictions_table(game_type):
    """Returns the appropriate predictions table model based on game type."""
    from .lotto_schema import (
        UltraLotto658Predictions, GrandLotto655Predictions, SuperLotto649Predictions,
        MegaLotto645Predictions, Lotto642Predictions
    )
    
    table_map = {
        'ultra_lotto_6_58': UltraLotto658Predictions,
        'grand_lotto_6_55': GrandLotto655Predictions,
        'super_lotto_6_49': SuperLotto649Predictions,
        'mega_lotto_6_45': MegaLotto645Predictions,
        'lotto_6_42': Lotto642Predictions
    }
    
    return table_map.get(game_type)

def get_prediction_accuracy_table(game_type):
    """Returns the appropriate prediction accuracy table model based on game type."""
    from .lotto_schema import (
        UltraLotto658PredictionAccuracy, GrandLotto655PredictionAccuracy,
        SuperLotto649PredictionAccuracy, MegaLotto645PredictionAccuracy,
        Lotto642PredictionAccuracy
    )
    
    table_map = {
        'ultra_lotto_6_58': UltraLotto658PredictionAccuracy,
        'grand_lotto_6_55': GrandLotto655PredictionAccuracy,
        'super_lotto_6_49': SuperLotto649PredictionAccuracy,
        'mega_lotto_6_45': MegaLotto645PredictionAccuracy,
        'lotto_6_42': Lotto642PredictionAccuracy
    }
    
    return table_map.get(game_type)

