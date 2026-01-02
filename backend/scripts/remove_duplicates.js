#!/usr/bin/env node
/**
 * Script to remove duplicate lottery results from InstantDB
 * Keeps only the first occurrence of each unique draw (by draw_date + draw_number)
 */

const { init } = require('@instantdb/admin');

const appId = process.env.INSTANTDB_APP_ID || 'beb7efd4-c8f7-4157-ad5a-80b2f55f4f87';
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN || 'c2a8a500-921f-449a-8fcd-b365f84cf172';

const db = init({ appId, adminToken });

async function removeDuplicates(gameType) {
  console.log(`\n[INFO] Checking for duplicates in ${gameType}_results...`);
  
  const entityName = `${gameType}_results`;
  
  try {
    // Query all results
    const result = await db.query({
      [entityName]: {}
    });
    
    if (!result[entityName]) {
      console.log(`[INFO] No results found for ${entityName}`);
      return;
    }
    
    const allResults = result[entityName];
    console.log(`[INFO] Found ${allResults.length} total results`);
    
    // Track unique draws and duplicates
    const seen = new Map();  // key: "date|draw_number" -> first occurrence
    const duplicates = [];
    
    for (const record of allResults) {
      const drawDate = record.draw_date;
      const drawNumber = record.draw_number || '';
      const key = `${drawDate}|${drawNumber}`;
      
      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        duplicates.push({
          id: record.id,
          date: drawDate,
          number: drawNumber
        });
      } else {
        // First occurrence - keep it
        seen.set(key, record);
      }
    }
    
    console.log(`[INFO] Found ${seen.size} unique draws`);
    console.log(`[INFO] Found ${duplicates.length} duplicates to remove`);
    
    if (duplicates.length === 0) {
      console.log(`[SUCCESS] No duplicates found! Database is clean.`);
      return;
    }
    
    // Delete duplicates in batches of 100
    console.log(`[INFO] Removing ${duplicates.length} duplicates...`);
    
    const batchSize = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = duplicates.slice(i, Math.min(i + batchSize, duplicates.length));
      
      const deleteTxs = batch.map(dup => 
        db.tx[entityName][dup.id].delete()
      );
      
      await db.transact(deleteTxs);
      
      deletedCount += batch.length;
      console.log(`[PROGRESS] Deleted ${deletedCount}/${duplicates.length} duplicates...`);
    }
    
    console.log(`[SUCCESS] Removed ${duplicates.length} duplicate records from ${entityName}`);
    console.log(`[SUCCESS] ${seen.size} unique draws remain`);
    
  } catch (error) {
    console.error(`[ERROR] Failed to remove duplicates:`, error.message);
    throw error;
  }
}

async function main() {
  const gameTypes = [
    'ultra_lotto_6_58',
    'grand_lotto_6_55',
    'super_lotto_6_49',
    'mega_lotto_6_45',
    'lotto_6_42'
  ];
  
  console.log('=== InstantDB Duplicate Removal Tool ===');
  console.log(`App ID: ${appId}`);
  console.log(`Processing ${gameTypes.length} game types...\n`);
  
  let totalDuplicatesRemoved = 0;
  
  for (const gameType of gameTypes) {
    try {
      const beforeCount = await getRecordCount(gameType);
      await removeDuplicates(gameType);
      const afterCount = await getRecordCount(gameType);
      
      const removed = beforeCount - afterCount;
      totalDuplicatesRemoved += removed;
      
      console.log(`[SUMMARY] ${gameType}: ${beforeCount} -> ${afterCount} (removed ${removed})`);
    } catch (error) {
      console.error(`[ERROR] Failed to process ${gameType}:`, error.message);
    }
  }
  
  console.log(`\n=== COMPLETE ===`);
  console.log(`Total duplicates removed: ${totalDuplicatesRemoved}`);
}

async function getRecordCount(gameType) {
  const entityName = `${gameType}_results`;
  const result = await db.query({ [entityName]: {} });
  return result[entityName] ? result[entityName].length : 0;
}

// Run the script
main().catch(error => {
  console.error('[FATAL ERROR]:', error);
  process.exit(1);
});

