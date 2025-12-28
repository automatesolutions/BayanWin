"""
InstantDB Python Client for Backend
Uses InstantDB REST API instead of direct PostgreSQL connection
Reference: https://www.instantdb.com/docs/backend
"""
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from config import Config


class InstantDBClient:
    """
    Python client for InstantDB backend operations.
    Uses InstantDB REST API - no PostgreSQL connection needed!
    """
    
    def __init__(self):
        self.app_id = Config.INSTANTDB_APP_ID
        self.admin_token = Config.INSTANTDB_ADMIN_TOKEN
        
        # InstantDB API base URL
        # Note: Check InstantDB docs for actual API endpoint
        self.base_url = f"https://api.instantdb.com/v1/apps/{self.app_id}"
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}' if self.admin_token else None
        }
        # Remove None values from headers
        self.headers = {k: v for k, v in self.headers.items() if v is not None}
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to InstantDB API."""
        import logging
        logger = logging.getLogger(__name__)
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, params=data, timeout=60)
            elif method == 'POST':
                logger.debug(f"POST to {url} with data: {data}")
                response = requests.post(url, headers=self.headers, json=data, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            result = response.json() if response.content else {}
            logger.debug(f"InstantDB API {method} {endpoint} success: {result}")
            return result
            
        except requests.exceptions.RequestException as e:
            error_msg = f"InstantDB API Error: {e}"
            logger.error(error_msg)
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response text: {e.response.text[:500]}")
            raise Exception(error_msg) from e
    
    # Results Operations
    def create_result(self, game_type: str, result_data: Dict) -> Dict:
        """Create a new lottery result in InstantDB."""
        entity_name = f"{game_type}_results"
        
        # Format data for InstantDB
        instantdb_data = {
            'draw_date': result_data.get('draw_date'),
            'draw_number': result_data.get('draw_number'),
            'number_1': result_data.get('number_1'),
            'number_2': result_data.get('number_2'),
            'number_3': result_data.get('number_3'),
            'number_4': result_data.get('number_4'),
            'number_5': result_data.get('number_5'),
            'number_6': result_data.get('number_6'),
            'jackpot': result_data.get('jackpot'),
            'winners': result_data.get('winners'),
            'created_at': datetime.now().isoformat() if not result_data.get('created_at') else result_data.get('created_at')
        }
        
        return self._make_request('POST', f'entities/{entity_name}', instantdb_data)
    
    def get_results(self, game_type: str, limit: int = 50, offset: int = 0, order_by: str = 'draw_date.desc') -> List[Dict]:
        """Get lottery results from InstantDB."""
        entity_name = f"{game_type}_results"
        
        query_params = {
            'limit': limit,
            'offset': offset,
            'order_by': order_by
        }
        
        response = self._make_request('GET', f'entities/{entity_name}', query_params)
        return response.get('data', [])
    
    def get_result_by_id(self, game_type: str, result_id: str) -> Optional[Dict]:
        """Get a specific result by ID."""
        entity_name = f"{game_type}_results"
        
        try:
            return self._make_request('GET', f'entities/{entity_name}/{result_id}')
        except:
            return None
    
    # Predictions Operations
    def create_prediction(self, game_type: str, prediction_data: Dict) -> Dict:
        """Create a new prediction in InstantDB."""
        entity_name = f"{game_type}_predictions"
        
        instantdb_data = {
            'target_draw_date': prediction_data.get('target_draw_date'),
            'model_type': prediction_data.get('model_type'),
            'predicted_number_1': prediction_data.get('predicted_number_1'),
            'predicted_number_2': prediction_data.get('predicted_number_2'),
            'predicted_number_3': prediction_data.get('predicted_number_3'),
            'predicted_number_4': prediction_data.get('predicted_number_4'),
            'predicted_number_5': prediction_data.get('predicted_number_5'),
            'predicted_number_6': prediction_data.get('predicted_number_6'),
            'previous_prediction_1': json.dumps(prediction_data.get('previous_prediction_1')) if prediction_data.get('previous_prediction_1') else None,
            'previous_prediction_2': json.dumps(prediction_data.get('previous_prediction_2')) if prediction_data.get('previous_prediction_2') else None,
            'previous_prediction_3': json.dumps(prediction_data.get('previous_prediction_3')) if prediction_data.get('previous_prediction_3') else None,
            'previous_prediction_4': json.dumps(prediction_data.get('previous_prediction_4')) if prediction_data.get('previous_prediction_4') else None,
            'previous_prediction_5': json.dumps(prediction_data.get('previous_prediction_5')) if prediction_data.get('previous_prediction_5') else None,
            'result_id': prediction_data.get('result_id'),
            'created_at': datetime.now().isoformat() if not prediction_data.get('created_at') else prediction_data.get('created_at')
        }
        
        return self._make_request('POST', f'entities/{entity_name}', instantdb_data)
    
    def get_predictions(self, game_type: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get predictions from InstantDB."""
        entity_name = f"{game_type}_predictions"
        
        query_params = {
            'limit': limit,
            'offset': offset,
            'order_by': 'created_at.desc'
        }
        
        response = self._make_request('GET', f'entities/{entity_name}', query_params)
        return response.get('data', [])
    
    # Prediction Accuracy Operations
    def create_prediction_accuracy(self, game_type: str, accuracy_data: Dict) -> Dict:
        """Create prediction accuracy record in InstantDB."""
        entity_name = f"{game_type}_prediction_accuracy"
        
        instantdb_data = {
            'prediction_id': accuracy_data.get('prediction_id'),
            'result_id': accuracy_data.get('result_id'),
            'error_distance': accuracy_data.get('error_distance'),
            'numbers_matched': accuracy_data.get('numbers_matched'),
            'distance_metrics': json.dumps(accuracy_data.get('distance_metrics')) if accuracy_data.get('distance_metrics') else None,
            'calculated_at': datetime.now().isoformat() if not accuracy_data.get('calculated_at') else accuracy_data.get('calculated_at')
        }
        
        return self._make_request('POST', f'entities/{entity_name}', instantdb_data)
    
    def get_prediction_accuracy(self, game_type: str, prediction_id: Optional[str] = None) -> List[Dict]:
        """Get prediction accuracy records."""
        entity_name = f"{game_type}_prediction_accuracy"
        
        query_params = {}
        if prediction_id:
            query_params['prediction_id'] = prediction_id
        
        response = self._make_request('GET', f'entities/{entity_name}', query_params)
        return response.get('data', [])
    
    # Query Operations (using InstaQL-like syntax)
    def query(self, query: Dict) -> Dict:
        """
        Execute a query using InstantDB's query language.
        
        Example:
            client.query({
                'ultra_lotto_6_58_results': {
                    'limit': 10,
                    'order_by': 'draw_date.desc'
                }
            })
        """
        return self._make_request('POST', 'query', {'query': query})


# Global instance
instantdb = InstantDBClient()

