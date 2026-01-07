// Node.js script to query prediction accuracy from InstantDB
const { init } = require('@instantdb/admin');

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
    const { game_type } = data;
    
    if (!game_type) {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_prediction_accuracy`;
    
    // Query the entity
    const result = await db.query({
      [entityName]: {}
    });
    
    if (!result[entityName]) {
      console.log(JSON.stringify({ accuracy: [], total: 0 }));
      return;
    }
    
    let accuracy = result[entityName];
    
    // Sort by calculated_at (newest first)
    accuracy.sort((a, b) => {
      const aDate = new Date(a.calculated_at || 0);
      const bDate = new Date(b.calculated_at || 0);
      return bDate - aDate;  // Newest first
    });
    
    console.log(JSON.stringify({ 
      accuracy: accuracy, 
      total: accuracy.length 
    }));
    
  } catch (error) {
    console.error(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }));
    process.exit(1);
  }
});

