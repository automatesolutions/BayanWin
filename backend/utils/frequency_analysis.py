"""Frequency analysis utilities for lottery numbers - Using InstantDB."""
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from services.instantdb_client import instantdb
from config import Config

def calculate_frequency(game_type: str, days_back: int = None) -> Dict[int, int]:
    """
    Calculate frequency of each number for a game.
    
    Args:
        game_type: Game type identifier
        days_back: Optional number of days to look back (None for all time)
        
    Returns:
        Dictionary mapping number to frequency count
    """
    # Get all results from InstantDB
    results = instantdb.get_results(game_type, limit=10000, offset=0)
    
    if days_back:
        cutoff_date = (datetime.now() - timedelta(days=days_back)).date()
        results = [r for r in results if r.get('draw_date') and datetime.fromisoformat(r['draw_date'].replace('Z', '+00:00')).date() >= cutoff_date]
    
    all_numbers = []
    for result in results:
        all_numbers.extend([
            result.get('number_1'), result.get('number_2'), result.get('number_3'),
            result.get('number_4'), result.get('number_5'), result.get('number_6')
        ])
    
    return dict(Counter(all_numbers))

def get_hot_numbers(game_type: str, top_n: int = 20, days_back: int = None) -> List[Tuple[int, int]]:
    """
    Get hot numbers (most frequently drawn).
    
    Args:
        game_type: Game type identifier
        top_n: Number of top numbers to return
        days_back: Optional number of days to look back
        
    Returns:
        List of tuples (number, frequency) sorted by frequency descending
    """
    frequency = calculate_frequency(game_type, days_back)
    sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
    return sorted_numbers[:top_n]

def get_cold_numbers(game_type: str, bottom_n: int = 20, days_back: int = None) -> List[Tuple[int, int]]:
    """
    Get cold numbers (least frequently drawn).
    
    Args:
        game_type: Game type identifier
        bottom_n: Number of bottom numbers to return
        days_back: Optional number of days to look back
        
    Returns:
        List of tuples (number, frequency) sorted by frequency ascending
    """
    frequency = calculate_frequency(game_type, days_back)
    sorted_numbers = sorted(frequency.items(), key=lambda x: x[1])
    return sorted_numbers[:bottom_n]

def get_overdue_numbers(game_type: str) -> List[Tuple[int, int]]:
    """
    Get overdue numbers (not drawn recently).
    
    Args:
        game_type: Game type identifier
        
    Returns:
        List of tuples (number, days_since_last_draw)
    """
    # Get max number range for the game
    max_number = Config.GAMES[game_type]['max_number']
    
    # Get all results ordered by date descending
    results = instantdb.get_results(game_type, limit=10000, offset=0, order_by='draw_date.desc')
    
    if not results:
        return []
    
    # Parse latest date
    latest_date_str = results[0].get('draw_date')
    if not latest_date_str:
        return []
    
    try:
        latest_date = datetime.fromisoformat(latest_date_str.replace('Z', '+00:00')).date()
    except:
        return []
    
    number_last_seen = {}
    
    # Track when each number was last seen
    for result in results:
        draw_date_str = result.get('draw_date')
        if not draw_date_str:
            continue
        
        try:
            draw_date = datetime.fromisoformat(draw_date_str.replace('Z', '+00:00')).date()
        except:
            continue
        
        numbers = [
            result.get('number_1'), result.get('number_2'), result.get('number_3'),
            result.get('number_4'), result.get('number_5'), result.get('number_6')
        ]
        for num in numbers:
            if num and num not in number_last_seen:
                number_last_seen[num] = draw_date
    
    # Calculate days since last draw for all numbers
    overdue = []
    oldest_date = latest_date
    if results:
        oldest_date_str = results[-1].get('draw_date')
        if oldest_date_str:
            try:
                oldest_date = datetime.fromisoformat(oldest_date_str.replace('Z', '+00:00')).date()
            except:
                pass
    
    for num in range(1, max_number + 1):
        if num in number_last_seen:
            days_since = (latest_date - number_last_seen[num]).days
        else:
            # Number never drawn
            days_since = (latest_date - oldest_date).days if oldest_date else 999
        
        overdue.append((num, days_since))
    
    # Sort by days since last draw (descending)
    overdue.sort(key=lambda x: x[1], reverse=True)
    
    return overdue
