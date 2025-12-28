export const GAMES = {
  ultra_lotto_6_58: {
    id: 'ultra_lotto_6_58',
    name: 'Ultra Lotto 6/58',
    minNumber: 1,
    maxNumber: 58,
    numbersCount: 6
  },
  grand_lotto_6_55: {
    id: 'grand_lotto_6_55',
    name: 'Grand Lotto 6/55',
    minNumber: 1,
    maxNumber: 55,
    numbersCount: 6
  },
  super_lotto_6_49: {
    id: 'super_lotto_6_49',
    name: 'Super Lotto 6/49',
    minNumber: 1,
    maxNumber: 49,
    numbersCount: 6
  },
  mega_lotto_6_45: {
    id: 'mega_lotto_6_45',
    name: 'Mega Lotto 6/45',
    minNumber: 1,
    maxNumber: 45,
    numbersCount: 6
  },
  lotto_6_42: {
    id: 'lotto_6_42',
    name: 'Lotto 6/42',
    minNumber: 1,
    maxNumber: 42,
    numbersCount: 6
  }
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// InstantDB is handled by the backend - no frontend config needed!

export const MODEL_TYPES = {
  XGBoost: 'XGBoost',
  DecisionTree: 'DecisionTree',
  MarkovChain: 'MarkovChain',
  AnomalyDetection: 'AnomalyDetection',
  DRL: 'DRL'
};

// Entity name mappings (for reference - backend handles InstantDB)
export const ENTITY_NAMES = {
  ultra_lotto_6_58: {
    results: 'ultra_lotto_6_58_results',
    predictions: 'ultra_lotto_6_58_predictions',
    accuracy: 'ultra_lotto_6_58_prediction_accuracy'
  },
  grand_lotto_6_55: {
    results: 'grand_lotto_6_55_results',
    predictions: 'grand_lotto_6_55_predictions',
    accuracy: 'grand_lotto_6_55_prediction_accuracy'
  },
  super_lotto_6_49: {
    results: 'super_lotto_6_49_results',
    predictions: 'super_lotto_6_49_predictions',
    accuracy: 'super_lotto_6_49_prediction_accuracy'
  },
  mega_lotto_6_45: {
    results: 'mega_lotto_6_45_results',
    predictions: 'mega_lotto_6_45_predictions',
    accuracy: 'mega_lotto_6_45_prediction_accuracy'
  },
  lotto_6_42: {
    results: 'lotto_6_42_results',
    predictions: 'lotto_6_42_predictions',
    accuracy: 'lotto_6_42_prediction_accuracy'
  }
};

