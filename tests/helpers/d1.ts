import { type SQLQueryBindings, Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';

const schema = readFileSync(
  new URL('../../migrations/0001_counters.sql', import.meta.url),
  'utf8',
);

interface TestStatement {
  sql: string;
  values: SQLQueryBindings[];
  bind(...values: SQLQueryBindings[]): TestStatement;
  first<T>(): Promise<T | null>;
}

export function createTestDatabase() {
  const sqlite = new Database(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(schema);

  function prepare(
    sql: string,
    values: SQLQueryBindings[] = [],
  ): TestStatement {
    return {
      sql,
      values,
      bind: (...bound) => prepare(sql, bound),
      async first<T>() {
        return sqlite.query<T, SQLQueryBindings[]>(sql).get(...values);
      },
    };
  }

  const db = {
    prepare,
    async batch(statements: TestStatement[]) {
      return sqlite.transaction(() =>
        statements.map(({ sql, values }) => ({
          success: true,
          results: sqlite.query(sql).all(...values),
        })),
      )();
    },
  } as unknown as D1Database;

  return { db, sqlite };
}
