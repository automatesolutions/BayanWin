"""SQLAlchemy models for lotto results, predictions, and accuracy tables."""
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from .database import Base

# Results Tables (one per game)

class UltraLotto658Results(Base):
    __tablename__ = 'ultra_lotto_6_58_results'
    
    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False)
    draw_number = Column(String, nullable=False)
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    jackpot = Column(Numeric(15, 2), nullable=True)
    winners = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('draw_date', 'draw_number', name='uq_ultra_lotto_draw'),)

class GrandLotto655Results(Base):
    __tablename__ = 'grand_lotto_6_55_results'
    
    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False)
    draw_number = Column(String, nullable=False)
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    jackpot = Column(Numeric(15, 2), nullable=True)
    winners = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('draw_date', 'draw_number', name='uq_grand_lotto_draw'),)

class SuperLotto649Results(Base):
    __tablename__ = 'super_lotto_6_49_results'
    
    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False)
    draw_number = Column(String, nullable=False)
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    jackpot = Column(Numeric(15, 2), nullable=True)
    winners = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('draw_date', 'draw_number', name='uq_super_lotto_draw'),)

class MegaLotto645Results(Base):
    __tablename__ = 'mega_lotto_6_45_results'
    
    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False)
    draw_number = Column(String, nullable=False)
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    jackpot = Column(Numeric(15, 2), nullable=True)
    winners = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('draw_date', 'draw_number', name='uq_mega_lotto_draw'),)

class Lotto642Results(Base):
    __tablename__ = 'lotto_6_42_results'
    
    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False)
    draw_number = Column(String, nullable=False)
    number_1 = Column(Integer, nullable=False)
    number_2 = Column(Integer, nullable=False)
    number_3 = Column(Integer, nullable=False)
    number_4 = Column(Integer, nullable=False)
    number_5 = Column(Integer, nullable=False)
    number_6 = Column(Integer, nullable=False)
    jackpot = Column(Numeric(15, 2), nullable=True)
    winners = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('draw_date', 'draw_number', name='uq_lotto_6_42_draw'),)

# Predictions Tables (one per game)

class UltraLotto658Predictions(Base):
    __tablename__ = 'ultra_lotto_6_58_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    target_draw_date = Column(Date, nullable=False)
    model_type = Column(String, nullable=False)
    predicted_number_1 = Column(Integer, nullable=False)
    predicted_number_2 = Column(Integer, nullable=False)
    predicted_number_3 = Column(Integer, nullable=False)
    predicted_number_4 = Column(Integer, nullable=False)
    predicted_number_5 = Column(Integer, nullable=False)
    predicted_number_6 = Column(Integer, nullable=False)
    previous_prediction_1 = Column(JSON, nullable=True)
    previous_prediction_2 = Column(JSON, nullable=True)
    previous_prediction_3 = Column(JSON, nullable=True)
    previous_prediction_4 = Column(JSON, nullable=True)
    previous_prediction_5 = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    result_id = Column(Integer, ForeignKey('ultra_lotto_6_58_results.id'), nullable=True)

class GrandLotto655Predictions(Base):
    __tablename__ = 'grand_lotto_6_55_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    target_draw_date = Column(Date, nullable=False)
    model_type = Column(String, nullable=False)
    predicted_number_1 = Column(Integer, nullable=False)
    predicted_number_2 = Column(Integer, nullable=False)
    predicted_number_3 = Column(Integer, nullable=False)
    predicted_number_4 = Column(Integer, nullable=False)
    predicted_number_5 = Column(Integer, nullable=False)
    predicted_number_6 = Column(Integer, nullable=False)
    previous_prediction_1 = Column(JSON, nullable=True)
    previous_prediction_2 = Column(JSON, nullable=True)
    previous_prediction_3 = Column(JSON, nullable=True)
    previous_prediction_4 = Column(JSON, nullable=True)
    previous_prediction_5 = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    result_id = Column(Integer, ForeignKey('grand_lotto_6_55_results.id'), nullable=True)

class SuperLotto649Predictions(Base):
    __tablename__ = 'super_lotto_6_49_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    target_draw_date = Column(Date, nullable=False)
    model_type = Column(String, nullable=False)
    predicted_number_1 = Column(Integer, nullable=False)
    predicted_number_2 = Column(Integer, nullable=False)
    predicted_number_3 = Column(Integer, nullable=False)
    predicted_number_4 = Column(Integer, nullable=False)
    predicted_number_5 = Column(Integer, nullable=False)
    predicted_number_6 = Column(Integer, nullable=False)
    previous_prediction_1 = Column(JSON, nullable=True)
    previous_prediction_2 = Column(JSON, nullable=True)
    previous_prediction_3 = Column(JSON, nullable=True)
    previous_prediction_4 = Column(JSON, nullable=True)
    previous_prediction_5 = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    result_id = Column(Integer, ForeignKey('super_lotto_6_49_results.id'), nullable=True)

class MegaLotto645Predictions(Base):
    __tablename__ = 'mega_lotto_6_45_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    target_draw_date = Column(Date, nullable=False)
    model_type = Column(String, nullable=False)
    predicted_number_1 = Column(Integer, nullable=False)
    predicted_number_2 = Column(Integer, nullable=False)
    predicted_number_3 = Column(Integer, nullable=False)
    predicted_number_4 = Column(Integer, nullable=False)
    predicted_number_5 = Column(Integer, nullable=False)
    predicted_number_6 = Column(Integer, nullable=False)
    previous_prediction_1 = Column(JSON, nullable=True)
    previous_prediction_2 = Column(JSON, nullable=True)
    previous_prediction_3 = Column(JSON, nullable=True)
    previous_prediction_4 = Column(JSON, nullable=True)
    previous_prediction_5 = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    result_id = Column(Integer, ForeignKey('mega_lotto_6_45_results.id'), nullable=True)

class Lotto642Predictions(Base):
    __tablename__ = 'lotto_6_42_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    target_draw_date = Column(Date, nullable=False)
    model_type = Column(String, nullable=False)
    predicted_number_1 = Column(Integer, nullable=False)
    predicted_number_2 = Column(Integer, nullable=False)
    predicted_number_3 = Column(Integer, nullable=False)
    predicted_number_4 = Column(Integer, nullable=False)
    predicted_number_5 = Column(Integer, nullable=False)
    predicted_number_6 = Column(Integer, nullable=False)
    previous_prediction_1 = Column(JSON, nullable=True)
    previous_prediction_2 = Column(JSON, nullable=True)
    previous_prediction_3 = Column(JSON, nullable=True)
    previous_prediction_4 = Column(JSON, nullable=True)
    previous_prediction_5 = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    result_id = Column(Integer, ForeignKey('lotto_6_42_results.id'), nullable=True)

# Prediction Accuracy Tables (one per game)

class UltraLotto658PredictionAccuracy(Base):
    __tablename__ = 'ultra_lotto_6_58_prediction_accuracy'
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey('ultra_lotto_6_58_predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('ultra_lotto_6_58_results.id'), nullable=False)
    error_distance = Column(Numeric(10, 4), nullable=False)
    numbers_matched = Column(Integer, nullable=False)
    distance_metrics = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('prediction_id', 'result_id', name='uq_ultra_lotto_accuracy'),)

class GrandLotto655PredictionAccuracy(Base):
    __tablename__ = 'grand_lotto_6_55_prediction_accuracy'
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey('grand_lotto_6_55_predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('grand_lotto_6_55_results.id'), nullable=False)
    error_distance = Column(Numeric(10, 4), nullable=False)
    numbers_matched = Column(Integer, nullable=False)
    distance_metrics = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('prediction_id', 'result_id', name='uq_grand_lotto_accuracy'),)

class SuperLotto649PredictionAccuracy(Base):
    __tablename__ = 'super_lotto_6_49_prediction_accuracy'
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey('super_lotto_6_49_predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('super_lotto_6_49_results.id'), nullable=False)
    error_distance = Column(Numeric(10, 4), nullable=False)
    numbers_matched = Column(Integer, nullable=False)
    distance_metrics = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('prediction_id', 'result_id', name='uq_super_lotto_accuracy'),)

class MegaLotto645PredictionAccuracy(Base):
    __tablename__ = 'mega_lotto_6_45_prediction_accuracy'
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey('mega_lotto_6_45_predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('mega_lotto_6_45_results.id'), nullable=False)
    error_distance = Column(Numeric(10, 4), nullable=False)
    numbers_matched = Column(Integer, nullable=False)
    distance_metrics = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('prediction_id', 'result_id', name='uq_mega_lotto_accuracy'),)

class Lotto642PredictionAccuracy(Base):
    __tablename__ = 'lotto_6_42_prediction_accuracy'
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey('lotto_6_42_predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('lotto_6_42_results.id'), nullable=False)
    error_distance = Column(Numeric(10, 4), nullable=False)
    numbers_matched = Column(Integer, nullable=False)
    distance_metrics = Column(JSON, nullable=False)
    calculated_at = Column(DateTime, nullable=False)
    
    __table_args__ = (UniqueConstraint('prediction_id', 'result_id', name='uq_lotto_6_42_accuracy'),)

