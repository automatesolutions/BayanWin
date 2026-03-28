// Upsert sheet ingest cursor for incremental Google Sheets sync
const { init, id } = require('@instantdb/admin');

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
    const { game_type, next_row, sheet_id } = data;
    if (!game_type || typeof game_type !== 'string') {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }
    if (typeof next_row !== 'number' || next_row < 2 || !Number.isFinite(next_row)) {
      console.error(JSON.stringify({ error: 'next_row must be a number >= 2' }));
      process.exit(1);
    }

    const now = new Date().toISOString();
    const sid = sheet_id != null ? String(sheet_id) : '';

    const res = await db.query({ sheet_ingest_cursors: {} });
    const rows = res.sheet_ingest_cursors || [];
    const existing = rows.find((r) => r.game_type === game_type);

    if (existing && existing.id) {
      await db.transact(
        db.tx.sheet_ingest_cursors[existing.id].update({
          next_row: Math.floor(next_row),
          sheet_id: sid || existing.sheet_id || '',
          updated_at: now,
        })
      );
      console.log(
        JSON.stringify({ success: true, id: existing.id, updated: true, next_row: Math.floor(next_row) })
      );
      return;
    }

    const nid = id();
    await db.transact(
      db.tx.sheet_ingest_cursors[nid].create({
        game_type,
        next_row: Math.floor(next_row),
        sheet_id: sid,
        created_at: now,
        updated_at: now,
      })
    );
    console.log(JSON.stringify({ success: true, id: nid, updated: false, next_row: Math.floor(next_row) }));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, stack: error.stack }));
    process.exit(1);
  }
});
