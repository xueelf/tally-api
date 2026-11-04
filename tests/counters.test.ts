import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { readCounter, recordVisit } from '../src/worker/counters';

import { createTestDatabase } from './helpers/d1';

const FIRST_IP = new Uint8Array(32).fill(1);
const SECOND_IP = new Uint8Array(32).fill(2);

describe('D1 counters', () => {
  let db: D1Database;
  let sqlite: ReturnType<typeof createTestDatabase>['sqlite'];

  beforeEach(() => {
    ({ db, sqlite } = createTestDatabase());
  });

  afterEach(() => {
    sqlite.close();
  });

  test('reading a missing counter does not create it', async () => {
    expect(await readCounter(db, 'site', 'page')).toBeNull();
    expect(sqlite.query('SELECT * FROM counters').all()).toEqual([]);
    expect(sqlite.query('SELECT * FROM visitors').all()).toEqual([]);
  });

  test('the first visit creates and persists the counter', async () => {
    const counter = { visit: 1, visitor: 1 };

    expect(await recordVisit(db, 'site', 'page', FIRST_IP)).toEqual(counter);
    expect(await readCounter(db, 'site', 'page')).toEqual(counter);
  });

  test('assigns a UUID and creation timestamp to each counter', async () => {
    await recordVisit(db, 'site', 'page', FIRST_IP);

    const row = sqlite
      .query<{ id: string; created_at: string }, []>(
        'SELECT id, created_at FROM counters',
      )
      .get()!;

    expect(row.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(row.created_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(Number.isNaN(Date.parse(row.created_at))).toBe(false);
  });

  test('repeated IPs only increase total visits', async () => {
    await recordVisit(db, 'site', 'page', FIRST_IP);

    expect(
      await recordVisit(db, 'site', 'page', new Uint8Array(FIRST_IP)),
    ).toEqual({
      visit: 2,
      visitor: 1,
    });
    expect(sqlite.query('SELECT * FROM visitors').all()).toHaveLength(1);
  });

  test('different IPs increase both totals', async () => {
    await recordVisit(db, 'site', 'page', FIRST_IP);

    expect(await recordVisit(db, 'site', 'page', SECOND_IP)).toEqual({
      visit: 2,
      visitor: 2,
    });
    expect(sqlite.query('SELECT * FROM visitors').all()).toHaveLength(2);
  });

  test('missing IPs increase visits without inventing a visitor', async () => {
    expect(await recordVisit(db, 'site', 'page', null)).toEqual({
      visit: 1,
      visitor: 0,
    });
    expect(await recordVisit(db, 'site', 'page', null)).toEqual({
      visit: 2,
      visitor: 0,
    });
    expect(sqlite.query('SELECT * FROM visitors').all()).toEqual([]);
    expect(await recordVisit(db, 'site', 'page', FIRST_IP)).toEqual({
      visit: 3,
      visitor: 1,
    });
  });

  test('namespaces and counter names have independent totals and visitors', async () => {
    await recordVisit(db, 'site', 'page', FIRST_IP);
    await recordVisit(db, 'site', 'page', FIRST_IP);

    expect(await recordVisit(db, 'other', 'page', FIRST_IP)).toEqual({
      visit: 1,
      visitor: 1,
    });
    expect(await recordVisit(db, 'site', 'other', FIRST_IP)).toEqual({
      visit: 1,
      visitor: 1,
    });
    expect(await readCounter(db, 'site', 'page')).toEqual({
      visit: 2,
      visitor: 1,
    });
  });

  test('a failed visitor write rolls back existing and new counter writes', async () => {
    await recordVisit(db, 'site', 'first', FIRST_IP);
    await recordVisit(db, 'site', 'second', SECOND_IP);
    sqlite.exec(
      'CREATE UNIQUE INDEX fail_duplicate_ip ON visitors (fingerprint)',
    );

    await expect(recordVisit(db, 'site', 'second', FIRST_IP)).rejects.toThrow();
    expect(await readCounter(db, 'site', 'second')).toEqual({
      visit: 1,
      visitor: 1,
    });

    await expect(recordVisit(db, 'site', 'third', FIRST_IP)).rejects.toThrow();
    expect(await readCounter(db, 'site', 'third')).toBeNull();
    expect(sqlite.query('SELECT * FROM visitors').all()).toHaveLength(2);
  });

  test('counters cannot exceed the JavaScript safe integer limit', async () => {
    sqlite
      .query(
        'INSERT INTO counters (id, namespace, name, visit, visitor) VALUES (?, ?, ?, ?, ?)',
      )
      .run(crypto.randomUUID(), 'site', 'page', Number.MAX_SAFE_INTEGER, 0);

    await expect(recordVisit(db, 'site', 'page', null)).rejects.toThrow();
    expect(await readCounter(db, 'site', 'page')).toEqual({
      visit: Number.MAX_SAFE_INTEGER,
      visitor: 0,
    });
  });

  test('the schema rejects fractional counts and invalid visitor records', async () => {
    expect(() =>
      sqlite
        .query(
          'INSERT INTO counters (id, namespace, name, visit, visitor) VALUES (?, ?, ?, ?, ?)',
        )
        .run(crypto.randomUUID(), 'site', 'fraction', 1.5, 0),
    ).toThrow();

    await recordVisit(db, 'site', 'page', FIRST_IP);
    const row = sqlite
      .query<{ id: string }, []>('SELECT id FROM counters')
      .get()!;
    const insert = sqlite.query(
      'INSERT INTO visitors (counter_id, fingerprint) VALUES (?, ?)',
    );

    expect(() => insert.run(row.id, 'invalid')).toThrow();
    expect(() => insert.run(row.id, new Uint8Array(1))).toThrow();
    expect(() => insert.run(-1, SECOND_IP)).toThrow();
    expect(sqlite.query('SELECT * FROM visitors').all()).toHaveLength(1);
  });
});
