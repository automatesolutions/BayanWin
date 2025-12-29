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
        """Create a new lottery result in InstantDB using Admin SDK via Node.js bridge."""
        import subprocess
        import json
        import os
        import logging
        logger = logging.getLogger(__name__)
        
        entity_name = f"{game_type}_results"
        
        # Format data for InstantDB schema exactly as defined
        instantdb_data = {
            'draw_date': result_data.get('draw_date'),
            'number_1': int(result_data.get('number_1')) if result_data.get('number_1') is not None else None,
            'number_2': int(result_data.get('number_2')) if result_data.get('number_2') is not None else None,
            'number_3': int(result_data.get('number_3')) if result_data.get('number_3') is not None else None,
            'number_4': int(result_data.get('number_4')) if result_data.get('number_4') is not None else None,
            'number_5': int(result_data.get('number_5')) if result_data.get('number_5') is not None else None,
            'number_6': int(result_data.get('number_6')) if result_data.get('number_6') is not None else None,
            'jackpot': float(result_data.get('jackpot')) if result_data.get('jackpot') is not None else None,
            'winners': int(result_data.get('winners')) if result_data.get('winners') is not None else 0,
        }
        
        # Add optional fields only if they exist and are not None
        if result_data.get('draw_number'):
            instantdb_data['draw_number'] = str(result_data.get('draw_number'))
        
        # Remove None values (but keep 0 values for numbers/winners)
        instantdb_data = {k: v for k, v in instantdb_data.items() if v is not None}
        
        # Use Node.js Admin SDK bridge (InstantDB REST API doesn't support writes)
        try:
            # Find the Node.js script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            script_path = os.path.join(current_dir, '..', 'scripts', 'save_results.js')
            script_path = os.path.normpath(script_path)
            
            if not os.path.exists(script_path):
                # Try alternative path
                alt_path = os.path.join(os.path.dirname(current_dir), 'scripts', 'save_results.js')
                if os.path.exists(alt_path):
                    script_path = alt_path
                else:
                    raise FileNotFoundError(f"Node.js script not found at {script_path}")
            
            # Prepare data for Node.js script
            input_data = {
                'game_type': game_type,
                'results': [instantdb_data]
            }
            
            # Set environment variables for Node.js script
            env = os.environ.copy()
            env['INSTANTDB_APP_ID'] = self.app_id
            env['INSTANTDB_ADMIN_TOKEN'] = self.admin_token
            
            # Call Node.js script
            result = subprocess.run(
                ['node', script_path],
                input=json.dumps(input_data),
                text=True,
                capture_output=True,
                timeout=30,
                env=env,
                cwd=os.path.dirname(script_path) or os.getcwd()
            )
            
            if result.returncode == 0:
                try:
                    response = json.loads(result.stdout)
                    logger.debug(f"Admin SDK bridge success: {response}")
                    return response
                except json.JSONDecodeError:
                    # If stdout is not JSON, check stderr for info
                    logger.debug(f"Admin SDK output: {result.stdout}")
                    return {'success': True, 'added': 1}
            else:
                error_msg = result.stderr or result.stdout
                logger.error(f"Node.js script failed: {error_msg}")
                raise Exception(f"Admin SDK bridge failed: {error_msg}")
                
        except FileNotFoundError as e:
            if 'node' in str(e).lower() or 'not found' in str(e).lower():
                logger.error("Node.js not found. Please install Node.js to use InstantDB Admin SDK.")
                raise Exception("Node.js is required for InstantDB writes. Please install Node.js from https://nodejs.org/")
            else:
                logger.error(f"Script file not found: {e}")
                raise Exception(f"Node.js script not found: {e}")
        except Exception as e:
            logger.error(f"Admin SDK bridge error: {e}")
            raise
    
    def get_results(self, game_type: str, limit: int = 50, offset: int = 0, order_by: str = 'draw_date.desc') -> List[Dict]:
        """Get lottery results from InstantDB using query format."""
        import logging
        logger = logging.getLogger(__name__)
        
        entity_name = f"{game_type}_results"
        
        # InstantDB uses InstaQL query format: POST to /query with { entity_name: { limit, offset, order_by } }
        query_data = {
            entity_name: {}
        }
        
        # Add query parameters if needed (InstantDB might handle these differently)
        if limit:
            query_data[entity_name]['limit'] = limit
        if offset:
            query_data[entity_name]['offset'] = offset
        if order_by:
            # Parse order_by (e.g., 'draw_date.desc' -> { field: 'draw_date', direction: 'desc' })
            parts = order_by.split('.')
            if len(parts) == 2:
                query_data[entity_name]['order_by'] = { 'field': parts[0], 'direction': parts[1] }
            else:
                query_data[entity_name]['order_by'] = order_by
        
        try:
            # Try POST query endpoint (InstantDB's InstaQL format)
            response = self._make_request('POST', 'query', query_data)
            logger.debug(f"Query response: {response}")
            
            # Response format: { entity_name: [data] } or { data: { entity_name: [data] } }
            if entity_name in response:
                data = response[entity_name]
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict) and 'data' in data:
                    return data['data'] if isinstance(data['data'], list) else []
            
            if 'data' in response:
                if entity_name in response['data']:
                    return response['data'][entity_name] if isinstance(response['data'][entity_name], list) else []
                # Might be direct list
                if isinstance(response['data'], list):
                    return response['data']
            
            # Fallback: try as direct list
            if isinstance(response, list):
                return response
                
            logger.warning(f"Unexpected query response format: {response}")
            return []
            
        except Exception as e:
            # Fallback to GET endpoint
            logger.warning(f"Query endpoint failed, trying GET: {e}")
            query_params = {
                'limit': limit,
                'offset': offset,
                'order_by': order_by
            }
            try:
                response = self._make_request('GET', f'entities/{entity_name}', query_params)
                # Try different response formats
                if isinstance(response, list):
                    return response
                if 'data' in response:
                    return response['data'] if isinstance(response['data'], list) else []
                if entity_name in response:
                    return response[entity_name] if isinstance(response[entity_name], list) else []
                return []
            except Exception as e2:
                logger.error(f"Both query methods failed: {e2}")
                return []
    
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

