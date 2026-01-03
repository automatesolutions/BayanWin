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

process.stdin.on('end', async () => {
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
    
    // Generate a NEW unique ID for each prediction (ensures new record, not replacement)
    const predictionId = id();
    
    console.error(`[INFO] Creating NEW prediction with ID: ${predictionId}`);
    console.error(`[INFO] Target date: ${prediction.target_draw_date}, Model: ${prediction.model_type}`);
    
    // Prepare data for new prediction record
    const newPredictionData = {
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
      newPredictionData.previous_prediction_1 = typeof prediction.previous_prediction_1 === 'string' 
        ? prediction.previous_prediction_1 
        : JSON.stringify(prediction.previous_prediction_1);
    }
    if (prediction.previous_prediction_2 !== null && prediction.previous_prediction_2 !== undefined) {
      newPredictionData.previous_prediction_2 = typeof prediction.previous_prediction_2 === 'string' 
        ? prediction.previous_prediction_2 
        : JSON.stringify(prediction.previous_prediction_2);
    }
    if (prediction.previous_prediction_3 !== null && prediction.previous_prediction_3 !== undefined) {
      newPredictionData.previous_prediction_3 = typeof prediction.previous_prediction_3 === 'string' 
        ? prediction.previous_prediction_3 
        : JSON.stringify(prediction.previous_prediction_3);
    }
    if (prediction.previous_prediction_4 !== null && prediction.previous_prediction_4 !== undefined) {
      newPredictionData.previous_prediction_4 = typeof prediction.previous_prediction_4 === 'string' 
        ? prediction.previous_prediction_4 
        : JSON.stringify(prediction.previous_prediction_4);
    }
    if (prediction.previous_prediction_5 !== null && prediction.previous_prediction_5 !== undefined) {
      newPredictionData.previous_prediction_5 = typeof prediction.previous_prediction_5 === 'string' 
        ? prediction.previous_prediction_5 
        : JSON.stringify(prediction.previous_prediction_5);
    }
    if (prediction.result_id !== null && prediction.result_id !== undefined) {
      newPredictionData.result_id = prediction.result_id;
    }
    
    // IMPORTANT: Use .create() with a NEW ID to ensure we're creating a new record, not updating
    // This will ADD a new prediction, not replace existing ones
    console.error(`[DEBUG] Entity name: ${entityName}`);
    console.error(`[DEBUG] Prediction ID: ${predictionId}`);
    console.error(`[DEBUG] Data keys: ${Object.keys(newPredictionData).join(', ')}`);
    
    try {
      // Create transaction - InstantDB Admin SDK
      const transaction = db.tx[entityName][predictionId].create(newPredictionData);
      
      // Execute transaction - InstantDB's transact is synchronous
      db.transact(transaction);
      
      console.error(`[INFO] Transaction submitted successfully for prediction ID: ${predictionId}`);
      
      // Wait a moment to ensure transaction is processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Try to verify the record was created by querying
      try {
        const { data } = await db.query({ [entityName]: { $: { id: predictionId } } });
        const created = data[entityName]?.find(p => p.id === predictionId);
        if (created) {
          console.error(`[INFO] ✅ Verified: Prediction record created successfully with ID: ${predictionId}`);
        } else {
          console.error(`[WARN] ⚠️  Prediction submitted but not yet visible in query (may need more time)`);
        }
      } catch (queryError) {
        console.error(`[WARN] Could not verify prediction (non-critical): ${queryError.message}`);
      }
      
      // Return success response
      console.log(JSON.stringify({ 
        success: true, 
        id: predictionId,
        entity: entityName
      }));
    } catch (transactError) {
      console.error(`[ERROR] Transaction failed: ${transactError.message}`);
      console.error(`[ERROR] Stack: ${transactError.stack}`);
      throw transactError;
    }
    
  } catch (error) {
    console.error(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }));
    process.exit(1);
  }
});

