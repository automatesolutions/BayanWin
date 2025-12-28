"""FastAPI application with API endpoints - Using InstantDB only."""
from fastapi import FastAPI, HTTPException, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, date
from services.instantdb_client import instantdb
from scrapers.pcso_scraper import PCSOScraper
from ml_models.xgboost_model import XGBoostModel
from ml_models.decision_tree import DecisionTreeModel
from ml_models.markov_chain import MarkovChainModel
from ml_models.anomaly_detection import AnomalyDetectionModel
from ml_models.drl_agent import DRLAgent
from utils.frequency_analysis import get_hot_numbers, get_cold_numbers, get_overdue_numbers, calculate_frequency
from utils.error_distance_calculator import calculate_all_metrics
from config import Config
from typing import Optional
from pydantic import BaseModel
import json

# Initialize FastAPI app
app = FastAPI(
    title="Lotto Prediction API",
    description="API for lottery predictions using ML models - InstantDB only",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
xgboost_model = XGBoostModel()
decision_tree_model = DecisionTreeModel()
markov_chain_model = MarkovChainModel()
anomaly_detection_model = AnomalyDetectionModel()
drl_agent = DRLAgent()

# Pydantic models for request/response validation
class ScrapeRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class CalculateAccuracyRequest(BaseModel):
    result_id: str  # Changed to string for InstantDB IDs
    game_type: str

@app.get("/api/games")
async def get_games():
    """List available games."""
    games = []
    for game_id, game_info in Config.GAMES.items():
        games.append({
            'id': game_id,
            'name': game_info['name'],
            'min_number': game_info['min_number'],
            'max_number': game_info['max_number'],
            'numbers_count': game_info['numbers_count']
        })
    return games

@app.get("/api/results/{game_type}")
async def get_results(
    game_type: str = Path(..., description="Game type identifier"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page")
):
    """Get historical results for a game."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    offset = (page - 1) * limit
    
    # Use InstantDB client
    results = instantdb.get_results(game_type, limit=limit, offset=offset, order_by='draw_date.desc')
    
    # Get total count (fetch all for now - InstantDB may have count endpoint)
    all_results = instantdb.get_results(game_type, limit=10000, offset=0)
    total = len(all_results)
    
    results_data = []
    for result in results:
        results_data.append({
            'id': result.get('id'),
            'draw_date': result.get('draw_date'),
            'draw_number': result.get('draw_number'),
            'numbers': [
                result.get('number_1'), result.get('number_2'), result.get('number_3'),
                result.get('number_4'), result.get('number_5'), result.get('number_6')
            ],
            'jackpot': result.get('jackpot'),
            'winners': result.get('winners'),
            'created_at': result.get('created_at')
        })
    
    return {
        'results': results_data,
        'total': total,
        'page': page,
        'limit': limit
    }

@app.post("/api/scrape")
async def scrape_data(request: ScrapeRequest):
    """Trigger data scraping with optional date range."""
    try:
        start_date = None
        end_date = None
        
        if request.start_date:
            try:
                start_date = datetime.strptime(request.start_date, '%Y-%m-%d')
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        if request.end_date:
            try:
                end_date = datetime.strptime(request.end_date, '%Y-%m-%d')
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        scraper = PCSOScraper()
        stats = scraper.scrape_all_games(start_date=start_date, end_date=end_date)
        
        return {
            'success': True,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/{game_type}")
async def generate_predictions(game_type: str = Path(..., description="Game type identifier")):
    """Get predictions from all 5 models."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        target_draw_date = date.today().isoformat()
        
        predictions = {}
        model_types = {
            'XGBoost': xgboost_model,
            'DecisionTree': decision_tree_model,
            'MarkovChain': markov_chain_model,
            'AnomalyDetection': anomaly_detection_model,
            'DRL': drl_agent
        }
        
        for model_name, model_instance in model_types.items():
            try:
                # Generate prediction (models now use InstantDB internally)
                predicted_numbers = model_instance.predict(game_type)
                
                # Get previous 5 predictions for this model
                previous_predictions = instantdb.get_predictions(game_type, limit=5)
                prev_preds = []
                
                for prev_pred in previous_predictions:
                    if prev_pred.get('model_type') == model_name:
                        prev_preds.append([
                            prev_pred.get('predicted_number_1'), prev_pred.get('predicted_number_2'),
                            prev_pred.get('predicted_number_3'), prev_pred.get('predicted_number_4'),
                            prev_pred.get('predicted_number_5'), prev_pred.get('predicted_number_6')
                        ])
                
                # Pad to 5 if needed
                while len(prev_preds) < 5:
                    prev_preds.append(None)
                
                # Store prediction in InstantDB
                prediction_data = {
                    'target_draw_date': target_draw_date,
                    'model_type': model_name,
                    'predicted_number_1': predicted_numbers[0],
                    'predicted_number_2': predicted_numbers[1],
                    'predicted_number_3': predicted_numbers[2],
                    'predicted_number_4': predicted_numbers[3],
                    'predicted_number_5': predicted_numbers[4],
                    'predicted_number_6': predicted_numbers[5],
                    'previous_prediction_1': prev_preds[0] if len(prev_preds) > 0 else None,
                    'previous_prediction_2': prev_preds[1] if len(prev_preds) > 1 else None,
                    'previous_prediction_3': prev_preds[2] if len(prev_preds) > 2 else None,
                    'previous_prediction_4': prev_preds[3] if len(prev_preds) > 3 else None,
                    'previous_prediction_5': prev_preds[4] if len(prev_preds) > 4 else None,
                    'created_at': datetime.now().isoformat()
                }
                
                new_prediction = instantdb.create_prediction(game_type, prediction_data)
                
                predictions[model_name] = {
                    'numbers': predicted_numbers,
                    'previous_predictions': prev_preds[:5],
                    'prediction_id': new_prediction.get('id')
                }
                
            except Exception as e:
                predictions[model_name] = {
                    'error': str(e)
                }
        
        return {
            'success': True,
            'game_type': game_type,
            'target_draw_date': target_draw_date,
            'predictions': predictions,
            'timestamp': datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/{game_type}")
async def get_predictions(
    game_type: str = Path(..., description="Game type identifier"),
    limit: int = Query(10, ge=1, le=100, description="Number of predictions to return")
):
    """Get stored predictions for a game."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    predictions = instantdb.get_predictions(game_type, limit=limit)
    
    predictions_data = []
    for pred in predictions:
        prev_preds = []
        for prev_pred_key in ['previous_prediction_1', 'previous_prediction_2',
                              'previous_prediction_3', 'previous_prediction_4',
                              'previous_prediction_5']:
            prev_pred = pred.get(prev_pred_key)
            if prev_pred:
                try:
                    # Parse JSON if stored as string
                    if isinstance(prev_pred, str):
                        prev_preds.append(json.loads(prev_pred))
                    else:
                        prev_preds.append(prev_pred)
                except:
                    pass
        
        predictions_data.append({
            'id': pred.get('id'),
            'model_type': pred.get('model_type'),
            'target_draw_date': pred.get('target_draw_date'),
            'numbers': [
                pred.get('predicted_number_1'), pred.get('predicted_number_2'), pred.get('predicted_number_3'),
                pred.get('predicted_number_4'), pred.get('predicted_number_5'), pred.get('predicted_number_6')
            ],
            'previous_predictions': prev_preds,
            'created_at': pred.get('created_at')
        })
    
    return {
        'predictions': predictions_data
    }

@app.post("/api/predictions/{prediction_id}/calculate-accuracy")
async def calculate_accuracy(
    prediction_id: str = Path(..., description="Prediction ID"),
    request: CalculateAccuracyRequest = Body(...)
):
    """Calculate and store error distance when actual results are available."""
    result_id = request.result_id
    game_type = request.game_type
    
    if not result_id or not game_type:
        raise HTTPException(status_code=400, detail="Missing result_id or game_type")
    
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        # Get prediction and result from InstantDB
        predictions = instantdb.get_predictions(game_type, limit=1000)
        prediction = next((p for p in predictions if p.get('id') == prediction_id), None)
        
        results = instantdb.get_results(game_type, limit=1000)
        result = next((r for r in results if r.get('id') == result_id), None)
        
        if not prediction or not result:
            raise HTTPException(status_code=404, detail="Prediction or result not found")
        
        predicted = [
            prediction.get('predicted_number_1'), prediction.get('predicted_number_2'),
            prediction.get('predicted_number_3'), prediction.get('predicted_number_4'),
            prediction.get('predicted_number_5'), prediction.get('predicted_number_6')
        ]
        
        actual = [
            result.get('number_1'), result.get('number_2'), result.get('number_3'),
            result.get('number_4'), result.get('number_5'), result.get('number_6')
        ]
        
        # Calculate metrics
        metrics = calculate_all_metrics(predicted, actual)
        
        # Store accuracy in InstantDB
        accuracy_data = {
            'prediction_id': prediction_id,
            'result_id': result_id,
            'error_distance': metrics.get('error_distance'),
            'numbers_matched': metrics.get('numbers_matched'),
            'distance_metrics': metrics,
            'calculated_at': datetime.now().isoformat()
        }
        
        instantdb.create_prediction_accuracy(game_type, accuracy_data)
        
        return {
            'success': True,
            'metrics': metrics
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/{game_type}/accuracy")
async def get_prediction_accuracy(
    game_type: str = Path(..., description="Game type identifier"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """Get prediction accuracy metrics and error distance analysis."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    accuracy_records = instantdb.get_prediction_accuracy(game_type)
    
    # Limit results
    accuracy_records = accuracy_records[:limit]
    
    accuracy_data = []
    for record in accuracy_records:
        distance_metrics = record.get('distance_metrics')
        if isinstance(distance_metrics, str):
            try:
                distance_metrics = json.loads(distance_metrics)
            except:
                distance_metrics = {}
        
        accuracy_data.append({
            'id': record.get('id'),
            'prediction_id': record.get('prediction_id'),
            'result_id': record.get('result_id'),
            'error_distance': record.get('error_distance'),
            'numbers_matched': record.get('numbers_matched'),
            'distance_metrics': distance_metrics,
            'calculated_at': record.get('calculated_at')
        })
    
    return {
        'accuracy_records': accuracy_data
    }

@app.get("/api/stats/{game_type}")
async def get_statistics(game_type: str = Path(..., description="Game type identifier")):
    """Get frequency statistics for a game."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        # Get frequency data using InstantDB
        hot_numbers = get_hot_numbers(game_type, top_n=20)
        cold_numbers = get_cold_numbers(game_type, bottom_n=20)
        overdue_numbers = get_overdue_numbers(game_type)
        
        # Get all results for stats
        all_results = instantdb.get_results(game_type, limit=10000, offset=0)
        total_draws = len(all_results)
        
        # Get date range
        date_range = None
        if all_results:
            dates = [r.get('draw_date') for r in all_results if r.get('draw_date')]
            if dates:
                date_range = {
                    'start': min(dates),
                    'end': max(dates)
                }
        
        # Calculate average jackpot
        jackpots = [float(r.get('jackpot')) for r in all_results if r.get('jackpot')]
        avg_jackpot = None
        if jackpots:
            avg_jackpot = sum(jackpots) / len(jackpots)
        
        return {
            'hot_numbers': [{'number': num, 'frequency': freq} for num, freq in hot_numbers],
            'cold_numbers': [{'number': num, 'frequency': freq} for num, freq in cold_numbers],
            'overdue_numbers': [{'number': num, 'days_since': days} for num, days in overdue_numbers[:20]],
            'total_draws': total_draws,
            'date_range': date_range,
            'average_jackpot': avg_jackpot
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        'status': 'healthy',
        'database': 'InstantDB',
        'timestamp': datetime.now().isoformat()
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5000,
        reload=Config.DEBUG
    )
