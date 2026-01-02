// Node.js script to save lottery predictions to InstantDB using Admin SDK
// Called from Python backend

const { init, id } = require('@instantdb/admin');

// Get credentials from environment - ensure they're valid strings
const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

// Validate credentials
if (!appId || appId === 'None' || appId === 'null' || appId.trim() === '') {
  console.error(JSON.stringify({ 
    error: 'INSTANTDB_APP_ID is required and must be a valid string',
    received: appId 
  }));
  process.exit(1);
}

if (!adminToken || adminToken === 'None' || adminToken === 'null' || adminToken.trim() === '') {
  console.error(JSON.stringify({ 
    error: 'INSTANTDB_ADMIN_TOKEN is required and must be a valid string',
    received: adminToken ? '***' : null
  }));
  process.exit(1);
}

// Initialize admin DB (schema is already deployed)
const db = init({ appId: appId.trim(), adminToken: adminToken.trim() });

// Read input from stdin
let inputData = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    const { game_type, prediction } = data;
    
    if (!game_type || !prediction) {
      console.error(JSON.stringify({ 
        error: 'Invalid input format. Expected {game_type: string, prediction: object}' 
      }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_predictions`;
    console.error(`[INFO] Saving prediction to ${entityName}...`);
    
    // Generate ID for the prediction
    const predictionId = id();
    
    // Prepare update data
    const updateData = {
      target_draw_date: prediction.target_draw_date,
      model_type: prediction.model_type,
      predicted_number_1: prediction.predicted_number_1,
      predicted_number_2: prediction.predicted_number_2,
      predicted_number_3: prediction.predicted_number_3,
      predicted_number_4: prediction.predicted_number_4,
      predicted_number_5: prediction.predicted_number_5,
      predicted_number_6: prediction.predicted_number_6,
      created_at: prediction.created_at || new Date().toISOString(), // Required field
    };
    
    // Add optional fields only if they exist
    if (prediction.previous_prediction_1 !== null && prediction.previous_prediction_1 !== undefined) {
      updateData.previous_prediction_1 = typeof prediction.previous_prediction_1 === 'string' 
        ? prediction.previous_prediction_1 
        : JSON.stringify(prediction.previous_prediction_1);
    }
    if (prediction.previous_prediction_2 !== null && prediction.previous_prediction_2 !== undefined) {
      updateData.previous_prediction_2 = typeof prediction.previous_prediction_2 === 'string' 
        ? prediction.previous_prediction_2 
        : JSON.stringify(prediction.previous_prediction_2);
    }
    if (prediction.previous_prediction_3 !== null && prediction.previous_prediction_3 !== undefined) {
      updateData.previous_prediction_3 = typeof prediction.previous_prediction_3 === 'string' 
        ? prediction.previous_prediction_3 
        : JSON.stringify(prediction.previous_prediction_3);
    }
    if (prediction.previous_prediction_4 !== null && prediction.previous_prediction_4 !== undefined) {
      updateData.previous_prediction_4 = typeof prediction.previous_prediction_4 === 'string' 
        ? prediction.previous_prediction_4 
        : JSON.stringify(prediction.previous_prediction_4);
    }
    if (prediction.previous_prediction_5 !== null && prediction.previous_prediction_5 !== undefined) {
      updateData.previous_prediction_5 = typeof prediction.previous_prediction_5 === 'string' 
        ? prediction.previous_prediction_5 
        : JSON.stringify(prediction.previous_prediction_5);
    }
    if (prediction.result_id !== null && prediction.result_id !== undefined) {
      updateData.result_id = prediction.result_id;
    }
    
    // Create transaction
    const transaction = db.tx[entityName][predictionId].create(updateData);
    
    // Execute transaction
    db.transact(transaction);
    
    console.log(JSON.stringify({ 
      success: true, 
      id: predictionId,
      entity: entityName
    }));
    
  } catch (error) {
    console.error(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }));
    process.exit(1);
  }
});

