import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Stream POST /api/predict/{gameType}?stream=true (NDJSON).
 * Calls onEvent for each line: { event: 'start'|'model'|'done'|'error', ... }.
 */
export async function generatePredictionsStream(gameType, options = {}) {
  const { includeCouncil = false, signal, onEvent } = options;
  if (typeof onEvent !== 'function') {
    throw new Error('generatePredictionsStream requires options.onEvent');
  }

  const url = new URL(`${API_BASE_URL}/api/predict/${encodeURIComponent(gameType)}`);
  url.searchParams.set('stream', 'true');
  if (includeCouncil) url.searchParams.set('include_council', 'true');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/x-ndjson, application/json',
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail ?? j.message ?? detail;
    } catch {
      try {
        detail = await res.text();
      } catch (_) {
        /* ignore */
      }
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        console.warn('NDJSON parse skipped:', line);
        continue;
      }
      onEvent(msg);
    }
  }
}

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

export const generatePredictions = (gameType, options = {}) => {
  const params = {};
  if (options.includeCouncil) params.include_council = true;
  return api.post(`/api/predict/${gameType}`, {}, { params });
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

export const autoCalculateAccuracy = (gameType = null) => {
  return api.post('/api/accuracy/auto-calculate', { game_type: gameType || null });
};

export const ingestApifyRun = (runId, gameType = null) => {
  return api.post('/api/ingest/apify', { run_id: runId, game_type: gameType || null });
};

export const fetchCouncilReport = (gameType, body) => {
  return api.post(`/api/predict/${gameType}/council-report`, body);
};

export const getCooccurrenceGraph = (gameType) => {
  return api.get(`/api/graphs/${gameType}/cooccurrence`);
};

export const getMarkovEdgesGraph = (gameType) => {
  return api.get(`/api/graphs/${gameType}/markov-edges`);
};

export const upsertUserMemory = (payload) => {
  return api.post('/api/memory/user', payload);
};

export const getUserMemory = (userKey) => {
  return api.get(`/api/memory/user/${encodeURIComponent(userKey)}`);
};

export default api;

