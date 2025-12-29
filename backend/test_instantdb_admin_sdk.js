// Test InstantDB using Admin SDK (Node.js)
const { init } = require('@instantdb/admin');
const schema = require('../lof-v2-db/src/instant.schema.ts');

const appId = 'beb7efd4-c8f7-4157-ad5a-80b2f55f4f87';
const adminToken = 'c2a8a500-921f-449a-8fcd-b365f84cf172';

const db = init({ appId, adminToken, schema });

// Test creating a result
async function testCreate() {
  console.log('Testing InstantDB Admin SDK...');
  
  const { id } = require('@instantdb/admin');
  const resultId = id();
  
  try {
    db.transact(
      db.tx.ultra_lotto_6_58_results[resultId].update({
        draw_date: '2025-01-01T00:00:00',
        draw_number: '01-02-03-04-05-06',
        number_1: 1,
        number_2: 2,
        number_3: 3,
        number_4: 4,
        number_5: 5,
        number_6: 6,
        jackpot: 1000000.0,
        winners: 0
      })
    );
    
    console.log('✅ Transaction submitted');
    
    // Query to verify
    const { data } = await db.query({ ultra_lotto_6_58_results: {} });
    console.log(`Found ${data.ultra_lotto_6_58_results?.length || 0} results`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCreate();

