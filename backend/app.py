"""FastAPI application with API endpoints - Using InstantDB only."""
from fastapi import FastAPI, HTTPException, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, date
from services.instantdb_client import instantdb
from scrapers.google_sheets_scraper import GoogleSheetsScraper
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
import logging

logger = logging.getLogger(__name__)

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
    # Date parameters not needed for Google Sheets (reads all data)
    # Kept for API compatibility
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    game_type: Optional[str] = None  # If specified, only scrape this game

class CalculateAccuracyRequest(BaseModel):
    result_id: str  # Changed to string for InstantDB IDs
    game_type: str

class AutoCalculateAccuracyRequest(BaseModel):
    game_type: Optional[str] = None

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

async def auto_calculate_accuracy_for_new_results(game_type: str = None):
    """
    Automatically match predictions to results and calculate accuracy.
    This runs after scraping to populate the Error Distance Analysis dashboard.
    """
    games_to_process = [game_type] if game_type else Config.GAMES.keys()
    
    total_calculated = 0
    
    for game in games_to_process:
        try:
            # Get all results (no date restriction - match all available results)
            results = instantdb.get_results(game, limit=1000)
            valid_results = []
            
            for r in results:
                draw_date = r.get('draw_date')
                if not draw_date:
                    continue
                
                # Validate that result has all required numbers
                if not all(r.get(f'number_{i}') for i in range(1, 7)):
                    continue
                
                valid_results.append(r)
            
            if not valid_results:
                logger.info(f"No valid results found for {game}")
                continue
            
            logger.info(f"Found {len(valid_results)} valid results for {game}")
            
            # Get predictions without accuracy records
            predictions = instantdb.get_predictions(game, limit=1000)
            logger.info(f"Found {len(predictions)} predictions for {game}")
            
            # Get existing accuracy records to avoid duplicates
            existing_accuracy = instantdb.get_prediction_accuracy(game)
            existing_pairs = set()
            for acc in existing_accuracy:
                pred_id = acc.get('prediction_id')
                res_id = acc.get('result_id')
                if pred_id and res_id:
                    existing_pairs.add((str(pred_id), str(res_id)))
            
            logger.info(f"Found {len(existing_pairs)} existing accuracy records for {game}")
            calculated_count = 0
            
            for result in valid_results:
                result_date_str = result.get('draw_date')
                if not result_date_str:
                    continue
                
                # Extract date part
                result_date = result_date_str.split('T')[0] if 'T' in result_date_str else result_date_str
                
                # Find predictions that match this result's draw date
                matching_predictions = []
                for p in predictions:
                    target_date = p.get('target_draw_date')
                    if not target_date:
                        continue
                    
                    # Extract date part
                    pred_date = target_date.split('T')[0] if 'T' in target_date else target_date
                    
                    # Normalize dates for comparison (handle different formats)
                    try:
                        # Try to parse and compare dates
                        pred_date_obj = datetime.strptime(pred_date, '%Y-%m-%d').date() if len(pred_date) == 10 else None
                        result_date_obj = datetime.strptime(result_date, '%Y-%m-%d').date() if len(result_date) == 10 else None
                        
                        if pred_date_obj and result_date_obj and pred_date_obj == result_date_obj:
                            matching_predictions.append(p)
                        elif pred_date == result_date:  # Fallback to string comparison
                            matching_predictions.append(p)
                    except:
                        # Fallback to string comparison
                        if pred_date == result_date:
                            matching_predictions.append(p)
                
                for prediction in matching_predictions:
                    pred_id = str(prediction.get('id'))
                    res_id = str(result.get('id'))
                    
                    # Check if this pair already has accuracy calculated
                    if (pred_id, res_id) in existing_pairs:
                        continue
                    
                    # Calculate accuracy automatically
                    try:
                        predicted = [
                            prediction.get('predicted_number_1'),
                            prediction.get('predicted_number_2'),
                            prediction.get('predicted_number_3'),
                            prediction.get('predicted_number_4'),
                            prediction.get('predicted_number_5'),
                            prediction.get('predicted_number_6')
                        ]
                        actual = [
                            result.get('number_1'), result.get('number_2'),
                            result.get('number_3'), result.get('number_4'),
                            result.get('number_5'), result.get('number_6')
                        ]
                        
                        # Validate numbers
                        if not all(isinstance(n, (int, float)) and n > 0 for n in predicted + actual):
                            continue
                        
                        metrics = calculate_all_metrics(predicted, actual)
                        
                        accuracy_data = {
                            'prediction_id': pred_id,
                            'result_id': res_id,
                            'error_distance': metrics.get('error_distance'),
                            'numbers_matched': metrics.get('numbers_matched'),
                            'distance_metrics': metrics,
                            'calculated_at': datetime.now().isoformat()
                        }
                        
                        instantdb.create_prediction_accuracy(game, accuracy_data)
                        existing_pairs.add((pred_id, res_id))
                        calculated_count += 1
                        total_calculated += 1
                        
                        logger.info(f"Auto-calculated accuracy for {game} prediction {pred_id} vs result {res_id}")
                    except Exception as e:
                        logger.warning(f"Failed to auto-calculate accuracy for {game} prediction {pred_id} vs result {res_id}: {e}")
                        import traceback
                        logger.debug(traceback.format_exc())
                        continue
            
            if calculated_count > 0:
                logger.info(f"Auto-calculated {calculated_count} accuracy records for {game}")
                
        except Exception as e:
            logger.error(f"Error in auto_calculate_accuracy_for_new_results for {game}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Continue processing other games even if one fails
            continue
    
    logger.info(f"Auto-calculation completed. Total calculated: {total_calculated}")
    return total_calculated

@app.get("/api/accuracy/diagnostics/{game_type}")
async def get_accuracy_diagnostics(game_type: str = Path(...)):
    """
    Get diagnostic information about predictions, results, and accuracy records.
    Helps debug why accuracy calculation might not be working.
    """
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        results = instantdb.get_results(game_type, limit=1000)
        predictions = instantdb.get_predictions(game_type, limit=1000)
        accuracy_records = instantdb.get_prediction_accuracy(game_type)
        
        # Sample some dates for debugging
        sample_result_dates = [r.get('draw_date') for r in results[:5] if r.get('draw_date')]
        sample_prediction_dates = [p.get('target_draw_date') for p in predictions[:5] if p.get('target_draw_date')]
        
        return {
            'game_type': game_type,
            'total_results': len(results),
            'total_predictions': len(predictions),
            'total_accuracy_records': len(accuracy_records),
            'sample_result_dates': sample_result_dates,
            'sample_prediction_dates': sample_prediction_dates,
            'has_valid_results': any(all(r.get(f'number_{i}') for i in range(1, 7)) for r in results),
            'has_valid_predictions': any(all(p.get(f'predicted_number_{i}') for i in range(1, 7)) for p in predictions)
        }
    except Exception as e:
        logger.error(f"Error in diagnostics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/accuracy/auto-calculate")
async def trigger_auto_calculate_accuracy(
    request: AutoCalculateAccuracyRequest = Body(...)
):
    """
    Manually trigger auto-calculation of accuracy for matching predictions and results.
    This can be called to populate the Error Distance Analysis dashboard.
    """
    try:
        game_type = request.game_type
        logger.info(f"Manual trigger: Auto-calculating accuracy for {game_type or 'all games'}")
        
        # First, get diagnostics
        if game_type:
            results = instantdb.get_results(game_type, limit=1000)
            predictions = instantdb.get_predictions(game_type, limit=1000)
            
            if len(results) == 0:
                return {
                    'success': False,
                    'total_calculated': 0,
                    'message': f'No results found for {game_type}. Please scrape results first.',
                    'diagnostics': {
                        'results_count': 0,
                        'predictions_count': len(predictions)
                    }
                }
            
            if len(predictions) == 0:
                return {
                    'success': False,
                    'total_calculated': 0,
                    'message': f'No predictions found for {game_type}. Please generate predictions first.',
                    'diagnostics': {
                        'results_count': len(results),
                        'predictions_count': 0
                    }
                }
        
        total_calculated = await auto_calculate_accuracy_for_new_results(game_type)
        
        return {
            'success': True,
            'total_calculated': total_calculated,
            'message': f'Successfully calculated {total_calculated} accuracy records' if total_calculated > 0 else 'No new accuracy records calculated. All predictions may already be matched or dates do not match.'
        }
    except Exception as e:
        logger.error(f"Error in manual auto-calculate: {e}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(error_trace)
        # Return more detailed error message
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to calculate accuracy: {str(e)}. Check server logs for details."
        )

@app.post("/api/scrape")
async def scrape_data(request: ScrapeRequest):
    """Trigger data scraping from Google Sheets. Can scrape all games or a specific game."""
    try:
        logger.info("Starting scrape operation...")
        scraper = GoogleSheetsScraper()
        
        try:
            # If game_type is specified, scrape only that game
            if request.game_type:
                if request.game_type not in Config.GAMES:
                    raise HTTPException(status_code=400, detail=f"Invalid game type: {request.game_type}")
                
                logger.info(f"Scraping single game: {request.game_type}")
                game_stats = await scraper.scrape_game(request.game_type)
                
                # Format response for single game
                stats = {
                    'total_games': 1,
                    'games': {request.game_type: game_stats},
                    'summary': {
                        'total_results_in_sheets': game_stats.get('total_in_sheet', 0),
                        'total_existing_in_db': game_stats.get('existing_in_db', 0),
                        'total_new_results': game_stats.get('new_results', 0),
                        'total_added': game_stats.get('added', 0)
                    }
                }
            else:
                # Scrape all games
                logger.info("Scraping all games")
                stats = await scraper.scrape_all_games()
            
            logger.info(f"Scrape completed. Stats: {stats}")
        except Exception as scrape_error:
            logger.error(f"Scrape operation failed: {scrape_error}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Scraping failed: {str(scrape_error)}"
            )
        
        # Check if scraping actually succeeded
        total_added = stats.get('summary', {}).get('total_added', 0)
        has_errors = any(
            game_stats.get('error') for game_stats in stats.get('games', {}).values()
        )
        
        # Log summary
        logger.info(f"Scraping summary: {total_added} results added, errors: {has_errors}")
        logger.info(f"Game stats: {stats.get('games', {})}")
        
        if has_errors and total_added == 0:
            # All games failed
            error_details = {
                game: game_stats.get('error', 'Unknown error')
                for game, game_stats in stats.get('games', {}).items()
                if game_stats.get('error')
            }
            logger.error(f"All scraping failed: {error_details}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to scrape data: {error_details}"
            )
        
        # Format stats for frontend compatibility
        frontend_stats = {
            'total_new': total_added,
            'total_duplicates': stats.get('summary', {}).get('total_existing_in_db', 0),
            'games_updated': [
                game_type for game_type, game_stats in stats.get('games', {}).items()
                if game_stats.get('added', 0) > 0
            ],
            'summary': stats.get('summary', {}),
            'games': stats.get('games', {})
        }
        
        # Return success response
        response = {
            'success': True,
            'stats': frontend_stats,
            'timestamp': datetime.now().isoformat(),
            'message': f'Successfully scraped {total_added} new results' if total_added > 0 else 'No new data to add (may already exist)'
        }
        
        # Log if no data was added (might be because all data already exists)
        if total_added == 0 and not has_errors:
            logger.info("No new data added - all results may already exist in database")
        else:
            logger.info(f"✅ Successfully added {total_added} new results to InstantDB")
        
        # Auto-calculate accuracy for new results (non-blocking)
        if total_added > 0:
            try:
                accuracy_count = await auto_calculate_accuracy_for_new_results(request.game_type)
                if accuracy_count > 0:
                    logger.info(f"Auto-calculated {accuracy_count} accuracy records")
                    
                    # Trigger DRL learning from newly calculated accuracy records
                    try:
                        if request.game_type:
                            accuracy_records = instantdb.get_prediction_accuracy(request.game_type)
                            predictions_all = instantdb.get_predictions(request.game_type, limit=1000)
                            drl_prediction_ids = {p.get('id') for p in predictions_all if p.get('model_type') == 'DRL'}
                            drl_accuracy = [acc for acc in accuracy_records if acc.get('prediction_id') in drl_prediction_ids]
                            
                            if len(drl_accuracy) >= 5:
                                drl_agent.learn_from_accuracy_records(request.game_type, drl_accuracy, instantdb)
                                logger.info(f"DRL agent updated after auto-calculating accuracy for {request.game_type}")
                    except Exception as e:
                        logger.warning(f"Failed to update DRL after auto-calculate (non-critical): {e}")
            except Exception as e:
                logger.warning(f"Auto-calculate accuracy failed (non-critical): {e}")
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in scrape endpoint: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Return error in format frontend expects
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )

@app.post("/api/predict/{game_type}")
async def generate_predictions(game_type: str = Path(..., description="Game type identifier")):
    """Get predictions from all 5 models."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        target_draw_date = date.today().isoformat()
        game_name = Config.GAMES[game_type]['name']
        
        # START LOGGING
        print("=" * 80)
        print(f"STARTING PREDICTION GENERATION FOR {game_name}")
        print(f"   Game Type: {game_type}")
        print(f"   Target Date: {target_draw_date}")
        print("=" * 80)
        logger.info("=" * 80)
        logger.info(f"🎯 STARTING PREDICTION GENERATION FOR {game_name}")
        logger.info(f"   Game Type: {game_type}")
        logger.info(f"   Target Date: {target_draw_date}")
        logger.info("=" * 80)
        
        predictions = {}
        model_types = {
            'XGBoost': xgboost_model,
            'DecisionTree': decision_tree_model,
            'MarkovChain': markov_chain_model,
            'AnomalyDetection': anomaly_detection_model,
            'DRL': drl_agent
        }
        
        total_models = len(model_types)
        current_model = 0
        
        for model_name, model_instance in model_types.items():
            current_model += 1
            try:
                # MODEL START
                print(f"\n[{current_model}/{total_models}] Training/Predicting with {model_name}...")
                logger.info(f"\n[{current_model}/{total_models}] 🤖 Training/Predicting with {model_name}...")
                import time
                start_time = time.time()
                
                # Generate prediction with timeout (longer timeout for DRL)
                import concurrent.futures
                timeout_seconds = 120 if model_name == 'DRL' else 60  # DRL needs more time
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(model_instance.predict, game_type)
                    try:
                        predicted_numbers = future.result(timeout=timeout_seconds)
                    except concurrent.futures.TimeoutError:
                        raise TimeoutError(f"{model_name} took longer than {timeout_seconds} seconds")
                
                elapsed = time.time() - start_time
                print(f"   ✅ {model_name} completed in {elapsed:.2f}s")
                print(f"   📊 Predicted numbers: {predicted_numbers}")
                logger.info(f"   ✅ {model_name} completed in {elapsed:.2f}s")
                logger.info(f"   📊 Predicted numbers: {predicted_numbers}")
                
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
                
                # Store prediction in InstantDB (creates NEW record, does NOT replace old ones)
                print(f"   💾 Creating NEW {model_name} prediction in database...")
                logger.info(f"   💾 Creating NEW {model_name} prediction in database (target_date: {target_draw_date})...")
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
                
                # This creates a NEW prediction record with a new unique ID
                # Old predictions are NOT deleted or replaced
                new_prediction = instantdb.create_prediction(game_type, prediction_data)
                prediction_id = new_prediction.get('id', 'unknown')
                print(f"   ✅ Created NEW prediction record with ID: {prediction_id}")
                logger.info(f"   ✅ Created NEW prediction record with ID: {prediction_id} (old predictions preserved)")
                
                predictions[model_name] = {
                    'numbers': predicted_numbers,
                    'previous_predictions': prev_preds[:5],
                    'prediction_id': new_prediction.get('id')
                }
                
            except Exception as e:
                print(f"   ❌ {model_name} FAILED: {str(e)}")
                logger.error(f"   ❌ {model_name} FAILED: {str(e)}")
                predictions[model_name] = {
                    'error': str(e)
                }
        
        # COMPLETION LOGGING
        print("\n" + "=" * 80)
        print(f"PREDICTION GENERATION COMPLETE!")
        print(f"   Successful: {sum(1 for p in predictions.values() if 'error' not in p)}/{total_models}")
        print(f"   Failed: {sum(1 for p in predictions.values() if 'error' in p)}/{total_models}")
        print("=" * 80)
        logger.info("\n" + "=" * 80)
        logger.info(f"🎉 PREDICTION GENERATION COMPLETE!")
        logger.info(f"   Successful: {sum(1 for p in predictions.values() if 'error' not in p)}/{total_models}")
        logger.info(f"   Failed: {sum(1 for p in predictions.values() if 'error' in p)}/{total_models}")
        logger.info("=" * 80)
        
        # Auto-calculate accuracy for newly generated predictions (non-blocking background task)
        try:
            # Use threading to run in background without blocking response
            import threading
            def run_auto_calculate():
                import asyncio
                try:
                    asyncio.run(auto_calculate_accuracy_for_new_results(game_type))
                except Exception as e:
                    logger.warning(f"Background auto-calculation failed: {e}")
            
            thread = threading.Thread(target=run_auto_calculate)
            thread.daemon = True
            thread.start()
            logger.info(f"✅ Triggered background auto-calculation of accuracy for {game_type}")
        except Exception as e:
            logger.warning(f"Failed to trigger auto-calculation after prediction generation: {e}")
        
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
        logger.error(f"❌ PREDICTION GENERATION FAILED: {str(e)}")
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
        
        # Trigger DRL learning from stored accuracy records if this is a DRL prediction
        if prediction.get('model_type') == 'DRL':
            try:
                # Get recent accuracy records for this game (DRL predictions only)
                accuracy_records = instantdb.get_prediction_accuracy(game_type)
                
                # Filter for DRL predictions
                predictions_all = instantdb.get_predictions(game_type, limit=1000)
                drl_prediction_ids = {p.get('id') for p in predictions_all if p.get('model_type') == 'DRL'}
                drl_accuracy = [acc for acc in accuracy_records if acc.get('prediction_id') in drl_prediction_ids]
                
                # Update DRL agent with new feedback
                if len(drl_accuracy) >= 5:  # Only update if we have enough data
                    drl_agent.learn_from_accuracy_records(game_type, drl_accuracy, instantdb)
                    logger.info(f"DRL agent updated with accuracy feedback for {game_type}")
            except Exception as e:
                logger.warning(f"Failed to update DRL with accuracy (non-critical): {e}")
        
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

@app.get("/api/stats/{game_type}/gaussian")
async def get_gaussian_distribution(game_type: str = Path(..., description="Game type identifier")):
    """Get Gaussian distribution analysis of winning numbers."""
    if game_type not in Config.GAMES:
        raise HTTPException(status_code=400, detail="Invalid game type")
    
    try:
        # Get all results
        all_results = instantdb.get_results(game_type, limit=10000, offset=0, order_by='draw_date.asc')
        
        distribution_data = []
        for result in all_results:
            numbers = [
                result.get('number_1'), result.get('number_2'), result.get('number_3'),
                result.get('number_4'), result.get('number_5'), result.get('number_6')
            ]
            
            # Filter out None values
            numbers = [n for n in numbers if n is not None]
            
            if len(numbers) == 6:
                # Calculate sum and product
                numbers_sum = sum(numbers)
                numbers_product = 1
                for num in numbers:
                    numbers_product *= num
                
                distribution_data.append({
                    'sum': numbers_sum,
                    'product': numbers_product,
                    'draw_date': result.get('draw_date'),
                    'numbers': numbers,
                    'winners': result.get('winners', 0),
                    'jackpot': result.get('jackpot', 0)
                })
        
        # Calculate statistics for Gaussian curve
        if distribution_data:
            sums = [d['sum'] for d in distribution_data]
            products = [d['product'] for d in distribution_data]
            
            import numpy as np
            
            # Calculate mean and std for sum
            sum_mean = np.mean(sums)
            sum_std = np.std(sums)
            
            # Calculate mean and std for product (use log scale due to large values)
            log_products = [np.log(p) if p > 0 else 0 for p in products]
            product_mean = np.mean(products)
            product_std = np.std(products)
            log_product_mean = np.mean(log_products)
            log_product_std = np.std(log_products)
            
            return {
                'distribution_data': distribution_data,
                'statistics': {
                    'sum': {
                        'mean': float(sum_mean),
                        'std': float(sum_std),
                        'min': min(sums),
                        'max': max(sums),
                        'count': len(sums)
                    },
                    'product': {
                        'mean': float(product_mean),
                        'std': float(product_std),
                        'min': min(products),
                        'max': max(products),
                        'log_mean': float(log_product_mean),
                        'log_std': float(log_product_std),
                        'count': len(products)
                    }
                }
            }
        
        return {
            'distribution_data': [],
            'statistics': None
        }
    
    except Exception as e:
        logger.error(f"Error calculating Gaussian distribution: {e}")
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
