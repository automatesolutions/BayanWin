import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for scraping large datasets
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getGames = () => {
  return api.get('/api/games');
};

export const getResults = (gameType, page = 1, limit = 50) => {
  return api.get(`/api/results/${gameType}`, {
    params: { page, limit }
  });
};

export const getPredictions = (gameType, limit = 10) => {
  return api.get(`/api/predictions/${gameType}`, {
    params: { limit }
  });
};

export const generatePredictions = (gameType) => {
  return api.post(`/api/predict/${gameType}`);
};

export const getStatistics = (gameType) => {
  return api.get(`/api/stats/${gameType}`);
};

export const getGaussianDistribution = (gameType) => {
  return api.get(`/api/stats/${gameType}/gaussian`);
};

export const getPredictionAccuracy = (gameType, limit = 100) => {
  return api.get(`/api/predictions/${gameType}/accuracy`, {
    params: { limit }
  });
};

export const calculateAccuracy = (predictionId, resultId, gameType) => {
  return api.post(`/api/predictions/${predictionId}/calculate-accuracy`, {
    result_id: resultId,
    game_type: gameType
  });
};

export const scrapeData = (data = {}) => {
  return api.post('/api/scrape', data);
};

export default api;

