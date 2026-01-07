// Node.js script to save prediction accuracy to InstantDB using Admin SDK
const { init, id } = require('@instantdb/admin');

// Get credentials from environment
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

// Initialize InstantDB Admin SDK
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
    const { game_type, accuracy } = data;
    
    if (!game_type || !accuracy) {
      console.error(JSON.stringify({ 
        error: 'Invalid input format. Expected {game_type: string, accuracy: object}' 
      }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_prediction_accuracy`;
    console.error(`[INFO] Saving accuracy to ${entityName}...`);
    
    // Generate a NEW unique ID for each accuracy record
    const accuracyId = id();
    
    console.error(`[INFO] Creating NEW accuracy record with ID: ${accuracyId}`);
    console.error(`[INFO] Prediction ID: ${accuracy.prediction_id}, Result ID: ${accuracy.result_id}`);
    
    // Prepare data for new accuracy record
    const newAccuracyData = {
      prediction_id: accuracy.prediction_id,
      result_id: accuracy.result_id,
      error_distance: accuracy.error_distance,
      numbers_matched: accuracy.numbers_matched,
      distance_metrics: accuracy.distance_metrics || null,
      calculated_at: accuracy.calculated_at || new Date().toISOString(),
    };
    
    // Update (or create) the entity
    await db.transact([
      db.tx[entityName][accuracyId].update(newAccuracyData)
    ]);
    
    console.error(`[SUCCESS] Saved accuracy record ${accuracyId}`);
    
    // Return success response
    console.log(JSON.stringify({
      success: true,
      id: accuracyId,
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

