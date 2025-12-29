// Node.js script to save data to InstantDB using Admin SDK
// This bridges Python backend to InstantDB since REST API might not support writes

const { init, id } = require('@instantdb/admin');

// Import schema (we'll need to compile it or use a different approach)
// For now, we'll initialize without schema for testing
const appId = process.env.INSTANTDB_APP_ID || 'beb7efd4-c8f7-4157-ad5a-80b2f55f4f87';
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN || 'c2a8a500-921f-449a-8fcd-b365f84cf172';

const db = init({ appId, adminToken });

// Read data from stdin (JSON array)
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(inputData);
    const { game_type, results } = data;
    
    if (!game_type || !results || !Array.isArray(results)) {
      console.error(JSON.stringify({ error: 'Invalid input format. Expected {game_type, results: []}' }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_results`;
    const transactions = results.map(result => {
      const resultId = id();
      return db.tx[entityName][resultId].update({
        draw_date: result.draw_date,
        draw_number: result.draw_number || null,
        number_1: result.number_1,
        number_2: result.number_2,
        number_3: result.number_3,
        number_4: result.number_4,
        number_5: result.number_5,
        number_6: result.number_6,
        jackpot: result.jackpot || null,
        winners: result.winners || 0,
      });
    });
    
    // Execute all transactions
    db.transact(transactions);
    
    console.log(JSON.stringify({ 
      success: true, 
      added: results.length,
      message: `Successfully added ${results.length} results to ${entityName}`
    }));
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, stack: error.stack }));
    process.exit(1);
  }
});

