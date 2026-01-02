// Node.js script to query lottery results from InstantDB with proper sorting
const { init } = require('@instantdb/admin');

const appId = process.env.INSTANTDB_APP_ID || 'beb7efd4-c8f7-4157-ad5a-80b2f55f4f87';
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN || 'c2a8a500-921f-449a-8fcd-b365f84cf172';

const db = init({ appId, adminToken });

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

