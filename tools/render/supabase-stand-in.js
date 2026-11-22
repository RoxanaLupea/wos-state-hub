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

  const matches = row => filters.every(test => test(row));
  const builder = {
    select() { return builder; },
    eq(column, value) { filters.push(row => row[column] === value); rows = rows.filter(row => row[column] === value); return builder; },
    neq(column, value) { filters.push(row => row[column] !== value); rows = rows.filter(row => row[column] !== value); return builder; },
    in(column, values) { filters.push(row => values.includes(row[column])); rows = rows.filter(row => values.includes(row[column])); return builder; },
    gte(column, value) { filters.push(row => row[column] >= value); rows = rows.filter(row => row[column] >= value); return builder; },
    lte(column, value) { filters.push(row => row[column] <= value); rows = rows.filter(row => row[column] <= value); return builder; },
    is(column, value) { filters.push(row => row[column] === value); rows = rows.filter(row => row[column] === value); return builder; },
    order(column, options = {}) {
      const direction = options.ascending === false ? -1 : 1;
      rows.sort((left, right) => (left[column] > right[column] ? 1 : left[column] < right[column] ? -1 : 0) * direction);
      return builder;
    },
    limit(count) { rows = rows.slice(0, count); return builder; },
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
      let data = rows;
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
      return Promise.resolve({ data, error: null }).then(resolve, reject);
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

export function createClient() {
  return { from: query, auth };
}
