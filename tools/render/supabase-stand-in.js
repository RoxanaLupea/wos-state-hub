// Stands in for @supabase/supabase-js when rendering in Claude's workspace, where the
// package cannot be installed. It answers the site's queries from a copy of the real
// tables in data/main.json, which is never committed (see fetch-data.sql).
//
// Changes (insert, update, upsert, delete) are kept in memory for the page's life, so
// editing can be tried here; nothing reaches the real database. Signing in is stood in
// too: a render signs in by putting a session in localStorage under
// "standInSession" ({ "user": { "id": "...", "user_metadata": { "full_name": "..." } } }).
import tables from './data/main.json';

let nextId = 100000;

function query(table) {
  tables[table] = tables[table] ?? [];
  const all = tables[table];
  let rows = all.slice();
  const filters = [];
  let action = 'select';
  let payload = null;
  let single = '';
  let conflictColumns = ['id'];
  const orders = [];
  let firstRow = 0;
  let rowCount = Infinity;
  let wantsCount = false;

  const matches = row => filters.every(test => test(row));
  const builder = {
    select(columns, options = {}) { wantsCount = options.count === 'exact'; return builder; },
    eq(column, value) { filters.push(row => row[column] === value); rows = rows.filter(row => row[column] === value); return builder; },
    neq(column, value) { filters.push(row => row[column] !== value); rows = rows.filter(row => row[column] !== value); return builder; },
    in(column, values) { filters.push(row => values.includes(row[column])); rows = rows.filter(row => values.includes(row[column])); return builder; },
    gte(column, value) { filters.push(row => row[column] >= value); rows = rows.filter(row => row[column] >= value); return builder; },
    lte(column, value) { filters.push(row => row[column] <= value); rows = rows.filter(row => row[column] <= value); return builder; },
    is(column, value) { filters.push(row => row[column] === value); rows = rows.filter(row => row[column] === value); return builder; },
    order(column, options = {}) { orders.push({ column, direction: options.ascending === false ? -1 : 1 }); return builder; },
    limit(count) { rowCount = count; return builder; },
    range(first, last) { firstRow = first; rowCount = last - first + 1; return builder; },
    single() { single = 'single'; return builder; },
    maybeSingle() { single = 'maybe'; return builder; },
    insert(values) { action = 'insert'; payload = values; return builder; },
    upsert(values, options = {}) {
      action = 'upsert'; payload = values;
      if (options.onConflict) conflictColumns = options.onConflict.split(',').map(one => one.trim());
      return builder;
    },
    update(values) { action = 'update'; payload = values; return builder; },
    delete() { action = 'delete'; return builder; },
    then(resolve, reject) {
      // Sorted by the first order given, then the next, as the database does.
      rows.sort((left, right) => {
        for (const { column, direction } of orders) {
          if (left[column] > right[column]) return direction;
          if (left[column] < right[column]) return -direction;
        }
        return 0;
      });
      const count = rows.length;
      // Like the real project, one request hands back at most 1000 rows.
      let data = rows.slice(firstRow, firstRow + Math.min(rowCount, 1000));
      if (action === 'insert' || action === 'upsert') {
        const list = Array.isArray(payload) ? payload : [payload];
        data = list.map(values => {
          // An upsert updates the row that has the same values in its conflict columns.
          const existing = action === 'upsert' && conflictColumns.every(column => values[column] !== undefined)
            ? all.find(row => conflictColumns.every(column => row[column] === values[column])) : null;
          if (existing) return Object.assign(existing, values);
          const row = { id: nextId++, ...values };
          all.push(row);
          return row;
        });
      } else if (action === 'update') {
        data = all.filter(matches).map(row => Object.assign(row, payload));
      } else if (action === 'delete') {
        data = all.filter(matches);
        for (const row of data) all.splice(all.indexOf(row), 1);
      }
      if (single) data = data[0] ?? null;
      return Promise.resolve({ data, error: null, count: wantsCount ? count : null }).then(resolve, reject);
    }
  };
  return builder;
}

const auth = {
  async getSession() {
    try {
      const stored = JSON.parse(window.localStorage.getItem('standInSession') ?? 'null');
      return { data: { session: stored }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },
  async signInWithOAuth() {
    window.localStorage.setItem('standInSession', JSON.stringify({
      user: { id: 'stand-in-user', user_metadata: { full_name: 'Stand-in player' } }
    }));
    window.location.reload();
    return { data: {}, error: null };
  },
  async signOut() {
    window.localStorage.removeItem('standInSession');
    return { error: null };
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } };
  }
};

// The database functions the site calls, answered from the same copy of the tables.
async function rpc(name, args) {
  const players = tables.game_players ?? [];
  if (name === 'look_up_game_account') {
    const row = players.find(one => one.player_id === args.player_number);
    const player = row?.data?.player;
    return { data: player ? { name: player.nick_name, avatar: player.avatar_url ?? null, power: player.power ?? null, state: player.kid ?? null,
      alliance: player.alliance?.abbr ?? null, furnace: player.furnace_level ?? null } : null, error: null };
  }
  if (name === 'ask_game_refresh') {
    const row = players.find(one => one.player_id === args.player_number);
    if (row) row.refresh_asked_at = new Date().toISOString();
    return { data: row?.read_at ?? null, error: null };
  }
  if (name === 'confirm_alliance_move') {
    const row = (tables.game_player_alliances ?? []).find(one => one.player_id === args.player_number);
    if (row?.moving_since) Object.assign(row, { state_number: row.moving_state, alliance_tag: row.moving_tag, moving_state: null, moving_tag: null, moving_since: null });
    return { data: null, error: null };
  }
  if (name === 'dismiss_alliance_move') {
    const row = (tables.game_player_alliances ?? []).find(one => one.player_id === args.player_number);
    if (row?.moving_since) row.dismissed_until = new Date(Date.now() + 3 * 86400000).toISOString();
    return { data: null, error: null };
  }
  if (name === 'game_rosters') {
    return { data: (tables.game_alliances ?? []).map(one => ({ state_number: one.state_number, tag: one.tag, read_at: one.read_at,
      game_read_at: one.game_read_at ?? null, data: { members: one.data?.members ?? [] } })), error: null };
  }
  if (name === 'transfer_dates') {
    const dates = [...new Set((tables.transfer_groups ?? []).map(one => one.transfer_date))].sort();
    return { data: dates, error: null };
  }
  if (name === 'game_state_ranks') {
    const rows = [];
    for (const state of tables.game_states ?? []) {
      for (const board of state.data?.boards ?? []) {
        for (const entry of board.rows ?? []) {
          if ((args.player_ids ?? []).includes(Number(entry.chief_id))) {
            rows.push({ player_id: Number(entry.chief_id), board: board.name, score: entry.score, label: entry.score_label ?? null, rank: entry.rank });
          }
        }
      }
    }
    return { data: rows, error: null };
  }
  if (name === 'set_game_account_kinds') {
    for (const [id, kind] of Object.entries(args.kinds ?? {})) {
      const row = (tables.game_accounts ?? []).find(one => String(one.id) === id);
      if (row) row.kind = kind;
    }
    return { data: null, error: null };
  }
  if (name === 'set_skill_level') {
    tables.exalted_skill_levels = tables.exalted_skill_levels ?? [];
    let row = tables.exalted_skill_levels.find(one => one.player_id === args.player_number);
    if (!row) { row = { player_id: args.player_number }; tables.exalted_skill_levels.push(row); }
    row[args.troop] = args.level;
    return { data: null, error: null };
  }
  return { data: null, error: { message: 'The stand-in has no function ' + name } };
}

export function createClient() {
  return { from: query, auth, rpc };
}
