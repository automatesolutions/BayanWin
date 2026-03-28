// User memory / preferences for council personalization (InstantDB)
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
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(inputData || '{}');
    const { action, user_key } = data;
    if (!user_key || typeof user_key !== 'string') {
      console.error(JSON.stringify({ error: 'user_key is required' }));
      process.exit(1);
    }

    const res = await db.query({ user_memory: {} });
    const rows = res.user_memory || [];
    const existing = rows.find((r) => r.user_key === user_key);

    if (action === 'get') {
      console.log(JSON.stringify({ record: existing || null }));
      return;
    }

    if (action === 'upsert') {
      const now = new Date().toISOString();
      const pinned = data.pinned_games != null ? String(data.pinned_games) : (existing?.pinned_games || '');
      const prefs = data.preferences != null ? String(data.preferences) : (existing?.preferences || '');
      const summary = data.last_summary != null ? String(data.last_summary) : (existing?.last_summary || '');

      if (existing && existing.id) {
        await db.transact(
          db.tx.user_memory[existing.id].update({
            pinned_games: pinned,
            preferences: prefs,
            last_summary: summary,
            updated_at: now,
          })
        );
        console.log(JSON.stringify({ success: true, id: existing.id, updated: true }));
        return;
      }

      const nid = id();
      await db.transact(
        db.tx.user_memory[nid].create({
          user_key,
          pinned_games: pinned,
          preferences: prefs,
          last_summary: summary,
          created_at: now,
          updated_at: now,
        })
      );
      console.log(JSON.stringify({ success: true, id: nid, updated: false }));
      return;
    }

    console.error(JSON.stringify({ error: 'Invalid action; use get or upsert' }));
    process.exit(1);
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, stack: error.stack }));
    process.exit(1);
  }
});
