// Query lottery results — prefer server-side limit/offset/order (fast).
// Falls back to loading the full entity only if the paginated query fails.
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

process.stdin.on('end', async () => {
  try {
    const data = JSON.parse(inputData);
    const { game_type, limit, offset, order_by } = data;

    if (!game_type) {
      console.error(JSON.stringify({ error: 'game_type is required' }));
      process.exit(1);
    }

    const entityName = `${game_type}_results`;
    // High cap for server-side / dedupe reads; HTTP /api/results caps limit separately (e.g. le=100).
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 50000);
    const off = Math.max(parseInt(offset, 10) || 0, 0);
    const ob = order_by || 'draw_date.desc';
    const parts = ob.split('.');
    const orderField = parts[0] || 'draw_date';
    const direction = parts[1] === 'asc' ? 'asc' : 'desc';

    async function legacyFullTableQuery() {
      const result = await db.query({ [entityName]: {} });
      if (!result[entityName]) {
        return { results: [], total: 0, has_more: false };
      }
      let rows = result[entityName];
      rows.sort((a, b) => {
        const aDate = new Date(a[orderField]);
        const bDate = new Date(b[orderField]);
        return direction === 'desc' ? bDate - aDate : aDate - bDate;
      });
      const total = rows.length;
      const pageRows = rows.slice(off, off + lim);
      return {
        results: pageRows,
        total,
        has_more: off + pageRows.length < total,
      };
    }

    try {
      const result = await db.query({
        [entityName]: {
          $: {
            limit: lim,
            offset: off,
            order: { [orderField]: direction },
          },
        },
      });

      const rows = result[entityName] || [];
      let total = null;
      if (result.pageInfo && result.pageInfo[entityName]) {
        const pi = result.pageInfo[entityName];
        if (typeof pi.rowCount === 'number') total = pi.rowCount;
        else if (typeof pi.count === 'number') total = pi.count;
        else if (typeof pi.totalCount === 'number') total = pi.totalCount;
      }

      let has_more;
      if (total != null) {
        has_more = off + rows.length < total;
      } else {
        has_more = rows.length === lim;
      }

      const out = { results: rows, has_more };
      if (total != null) out.total = total;
      console.log(JSON.stringify(out));
    } catch (paginatedErr) {
      console.error(
        JSON.stringify({
          warn: 'paginated_results_query_failed',
          detail: paginatedErr.message,
        })
      );
      const out = await legacyFullTableQuery();
      console.log(JSON.stringify(out));
    }
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
