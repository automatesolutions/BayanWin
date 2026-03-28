// Query sheet ingest cursor by game_type (InstantDB Admin SDK)
const { init } = require('@instantdb/admin');

const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

if (!appId || !appId.trim() || !adminToken || !adminToken.trim()) {
  console.error(JSON.stringify({ error: 'INSTANTDB credentials required' }));
  process.exit(1);
}

const db = init({ appId: appId.trim(), adminToken: adminToken.trim() });

let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});
process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(inputData || '{}');
    const { game_type } = data;
    if (!game_type || typeof game_type !== 'string') {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }

    const res = await db.query({ sheet_ingest_cursors: {} });
    const rows = res.sheet_ingest_cursors || [];
    const record = rows.find((r) => r.game_type === game_type) || null;

    console.log(JSON.stringify({ record }));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, stack: error.stack }));
    process.exit(1);
  }
});
