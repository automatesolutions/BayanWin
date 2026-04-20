// Fetch existing keys for candidate rows — chunked OR queries, exact field match.
// Avoids loading the entire results table on every scrape (see query_results.js).
const { init } = require('@instantdb/admin');

const appId = process.env.INSTANTDB_APP_ID;
const adminToken = process.env.INSTANTDB_ADMIN_TOKEN;

if (!appId || appId === 'None' || appId === 'null' || appId.trim() === '') {
  console.error(JSON.stringify({ error: 'INSTANTDB_APP_ID is required' }));
  process.exit(1);
}
if (!adminToken || adminToken === 'None' || adminToken === 'null' || adminToken.trim() === '') {
  console.error(JSON.stringify({ error: 'INSTANTDB_ADMIN_TOKEN is required' }));
  process.exit(1);
}

const db = init({ appId: appId.trim(), adminToken: adminToken.trim() });

let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

function compositeKey(drawDate, drawNumber) {
  let dateKey;
  if (drawDate == null || drawDate === '') {
    dateKey = '';
  } else if (typeof drawDate === 'string') {
    const s = drawDate.trim();
    dateKey = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  } else {
    dateKey = String(drawDate).slice(0, 10);
  }
  const dn = drawNumber == null || drawNumber === '' ? '' : String(drawNumber);
  return `${dateKey}|${dn}`;
}

process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(inputData);
    const { game_type, candidates } = data;

    if (!game_type) {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      console.log(JSON.stringify({ existing_keys: [] }));
      return;
    }

    const deduped = [];
    const sigSeen = new Set();
    for (const c of candidates) {
      const sig = `${c.draw_date}\0${c.draw_number == null ? '' : c.draw_number}`;
      if (sigSeen.has(sig)) continue;
      sigSeen.add(sig);
      deduped.push(c);
    }

    const entityName = `${game_type}_results`;
    const OR_CHUNK = 80;
    const rows = [];

    for (let i = 0; i < deduped.length; i += OR_CHUNK) {
      const chunk = deduped.slice(i, i + OR_CHUNK);
      const orClause = chunk.map((c) => {
        const out = {
          draw_date: c.draw_date,
        };
        if (c.draw_number != null && c.draw_number !== '') {
          out.draw_number = String(c.draw_number);
        }
        return out;
      });

      const result = await db.query({
        [entityName]: {
          $: {
            where: { or: orClause },
          },
        },
      });
      const part = result[entityName] || [];
      for (const r of part) {
        rows.push(r);
      }
    }

    const existingKeys = [];
    const seen = new Set();
    for (const r of rows) {
      const k = compositeKey(r.draw_date, r.draw_number);
      if (!seen.has(k)) {
        seen.add(k);
        existingKeys.push(k);
      }
    }

    console.log(JSON.stringify({ existing_keys: existingKeys }));
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      })
    );
    process.exit(1);
  }
});
