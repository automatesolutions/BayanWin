// Node.js script to save lottery results to InstantDB using Admin SDK
// Called from Python backend

const { init, id } = require('@instantdb/admin');

// Get credentials from environment
const appId = process.env.INSTANTDB_APP_ID || 'beb7efd4-c8f7-4157-ad5a-80b2f55f4f87';
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN || 'c2a8a500-921f-449a-8fcd-b365f84cf172';

// Initialize admin DB (schema is already deployed)
const db = init({ appId, adminToken });

// Read input from stdin
let inputData = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(inputData);
    const { game_type, results } = data;
    
    if (!game_type || !results || !Array.isArray(results)) {
      console.error(JSON.stringify({ 
        error: 'Invalid input format. Expected {game_type: string, results: array}' 
      }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_results`;
    console.error(`[INFO] Saving ${results.length} results to ${entityName}...`);
    
    // Create transactions for each result
    const transactions = results.map(result => {
      const resultId = id();
      const updateData = {
        draw_date: result.draw_date,
        number_1: result.number_1,
        number_2: result.number_2,
        number_3: result.number_3,
        number_4: result.number_4,
        number_5: result.number_5,
        number_6: result.number_6,
        created_at: new Date().toISOString(), // Required field
      };
      
      // Add optional fields only if they exist
      if (result.draw_number) {
        updateData.draw_number = result.draw_number;
      }
      if (result.jackpot !== null && result.jackpot !== undefined) {
        updateData.jackpot = result.jackpot;
      }
      if (result.winners !== null && result.winners !== undefined) {
        updateData.winners = result.winners;
      }
      
      return db.tx[entityName][resultId].create(updateData);
    });
    
    // Execute all transactions
    db.transact(transactions);
    
    console.log(JSON.stringify({ 
      success: true, 
      added: results.length,
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
