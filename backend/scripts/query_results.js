// Node.js script to query lottery results from InstantDB with proper sorting
const { init } = require('@instantdb/admin');

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
    const { game_type, limit, offset, order_by } = data;
    
    if (!game_type) {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }
    
    const entityName = `${game_type}_results`;
    
    // Query the entity
    const result = await db.query({
      [entityName]: {}
    });
    
    if (!result[entityName]) {
      console.log(JSON.stringify({ results: [], total: 0 }));
      return;
    }
    
    let results = result[entityName];
    
    // Sort results by draw_date
    // order_by format: "draw_date.desc" or "draw_date.asc"
    if (order_by) {
      const [field, direction] = order_by.split('.');
      results.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        // Handle date comparison
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        
        if (direction === 'desc') {
          return bDate - aDate;  // Newest first
        } else {
          return aDate - bDate;  // Oldest first
        }
      });
    }
    
    // Apply pagination
    const total = results.length;
    const start = offset || 0;
    const end = start + (limit || 50);
    const paginatedResults = results.slice(start, end);
    
    console.log(JSON.stringify({ 
      results: paginatedResults, 
      total: total 
    }));
    
  } catch (error) {
    console.error(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }));
    process.exit(1);
  }
});

