"""
InstantDB BaaS synchronization service for backend.
This module handles syncing data between PostgreSQL and InstantDB BaaS.
Reference: https://www.instantdb.com/docs
"""
import requests
import json
from config import Config
from typing import Dict, List, Optional

class InstantDBSync:
    """Service to sync data with InstantDB BaaS."""
    
    def __init__(self):
        self.app_id = Config.INSTANTDB_APP_ID
        self.base_url = f"https://api.instantdb.com/v1/apps/{self.app_id}"
        # Note: InstantDB API endpoints may vary - adjust based on actual API docs
        
    def sync_result(self, game_type: str, result_data: Dict) -> bool:
        """
        Sync a lottery result to InstantDB.
        
        Args:
            game_type: Game type identifier
            result_data: Result data dictionary
            
        Returns:
            True if successful, False otherwise
        """
        entity_name = f"{game_type}_results"
        
        try:
            # Map result data to InstantDB format
            instantdb_data = {
                'draw_date': str(result_data.get('draw_date', '')),
                'draw_number': result_data.get('draw_number', ''),
                'number_1': result_data.get('number_1'),
                'number_2': result_data.get('number_2'),
                'number_3': result_data.get('number_3'),
                'number_4': result_data.get('number_4'),
                'number_5': result_data.get('number_5'),
                'number_6': result_data.get('number_6'),
                'jackpot': result_data.get('jackpot'),
                'winners': result_data.get('winners'),
                'created_at': str(result_data.get('created_at', ''))
            }
            
            # Note: Actual InstantDB API endpoint structure may differ
            # This is a placeholder - adjust based on InstantDB API documentation
            response = requests.post(
                f"{self.base_url}/entities/{entity_name}",
                json=instantdb_data,
                headers={'Content-Type': 'application/json'}
            )
            
            return response.status_code in [200, 201]
            
        except Exception as e:
            print(f"Error syncing to InstantDB: {e}")
            return False
    
    def sync_prediction(self, game_type: str, prediction_data: Dict) -> bool:
        """
        Sync a prediction to InstantDB.
        
        Args:
            game_type: Game type identifier
            prediction_data: Prediction data dictionary
            
        Returns:
            True if successful, False otherwise
        """
        entity_name = f"{game_type}_predictions"
        
        try:
            instantdb_data = {
                'target_draw_date': str(prediction_data.get('target_draw_date', '')),
                'model_type': prediction_data.get('model_type', ''),
                'predicted_number_1': prediction_data.get('predicted_number_1'),
                'predicted_number_2': prediction_data.get('predicted_number_2'),
                'predicted_number_3': prediction_data.get('predicted_number_3'),
                'predicted_number_4': prediction_data.get('predicted_number_4'),
                'predicted_number_5': prediction_data.get('predicted_number_5'),
                'predicted_number_6': prediction_data.get('predicted_number_6'),
                'created_at': str(prediction_data.get('created_at', ''))
            }
            
            response = requests.post(
                f"{self.base_url}/entities/{entity_name}",
                json=instantdb_data,
                headers={'Content-Type': 'application/json'}
            )
            
            return response.status_code in [200, 201]
            
        except Exception as e:
            print(f"Error syncing prediction to InstantDB: {e}")
            return False

# Note: InstantDB BaaS is primarily frontend-focused
# The backend will continue using PostgreSQL directly
# This sync service is optional and can be used if InstantDB provides a REST API
# Otherwise, data sync happens automatically through InstantDB's PostgreSQL connection

