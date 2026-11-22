// Stands in for @supabase/supabase-js when rendering in Claude's workspace, where the
// package cannot be installed. It answers the site's queries from a copy of the real
// tables in data/main.json, which is never committed (see fetch-data.sql).
import tables from './data/main.json';

function query(table) {
  let rows = (tables[table] ?? []).slice();
  const builder = {
    select() { return builder; },
    eq(column, value) { rows = rows.filter(row => row[column] === value); return builder; },
    neq(column, value) { rows = rows.filter(row => row[column] !== value); return builder; },
    in(column, values) { rows = rows.filter(row => values.includes(row[column])); return builder; },
    gte(column, value) { rows = rows.filter(row => row[column] >= value); return builder; },
    lte(column, value) { rows = rows.filter(row => row[column] <= value); return builder; },
    is(column, value) { rows = rows.filter(row => row[column] === value); return builder; },
    order(column, options = {}) {
      const direction = options.ascending === false ? -1 : 1;
      rows.sort((left, right) => (left[column] > right[column] ? 1 : left[column] < right[column] ? -1 : 0) * direction);
      return builder;
    },
    limit(count) { rows = rows.slice(0, count); return builder; },
    then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); }
  };
  return builder;
}

export function createClient() {
  return { from: query };
}
