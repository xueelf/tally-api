import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { type Miniflare } from 'miniflare';

import { startLocalWorker } from '../scripts/local-worker';

let runtime: Miniflare;
let origin: URL;
let state: string;

beforeAll(async () => {
  state = await mkdtemp(join(tmpdir(), 'counterflare-d1-'));
  runtime = await startLocalWorker({
    persistTo: state,
    assetsDirectory: resolve('docs/public'),
  });
  origin = await runtime.ready;
}, 15_000);

afterAll(async () => {
  await runtime?.dispose();
  if (state) {
    await rm(state, { recursive: true, force: true });
  }
});

test('workerd accepts empty POST streams and rejects nonempty bodies before writing', async () => {
  const url = new URL('/api/counters/workerd/body', origin);
  const empty = new ReadableStream({ start: controller => controller.close() });

  expect((await fetch(url, { method: 'POST' })).status).toBe(201);
  expect((await fetch(url, { method: 'POST', body: empty })).status).toBe(200);
  expect((await fetch(url, { method: 'POST', body: 'x' })).status).toBe(400);
  expect(await (await fetch(url)).json()).toMatchObject({ visit: 2 });
});

test('workerd D1 preserves every concurrent visit and deduplicates IPs', async () => {
  const url = new URL('/api/counters/workerd/concurrent', origin);
  const responses = await Promise.all(
    Array.from({ length: 16 }, (_, i) =>
      fetch(url, {
        method: 'POST',
        headers: { 'CF-Connecting-IP': `192.0.2.${(i % 4) + 1}` },
      }),
    ),
  );
  const counts = await Promise.all(responses.map(response => response.json()));

  expect(responses.map(response => response.status).sort()).toEqual([
    ...Array<number>(15).fill(200),
    201,
  ]);
  expect(
    counts
      .map(count => (count as { visit: number }).visit)
      .sort((a, b) => a - b),
  ).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  expect(await (await fetch(url)).json()).toEqual({ visit: 16, visitor: 4 });
});

test('workerd exposes D1 error details in Error.message', async () => {
  const db = await runtime.getD1Database('DB');

  await expect(
    db.prepare('SELECT * FROM missing_table').first(),
  ).rejects.toThrow(/D1_ERROR: .*no such table: missing_table/);
});

test('workerd serves an SVG counter using the configured asset binding', async () => {
  const url = new URL('/counters/workerd/image.svg', origin);
  const response = await fetch(url);

  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toStartWith('image/svg+xml');
  expect(await response.text()).toContain('Visits: 1');
});
