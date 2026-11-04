import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import worker from '../src/worker';

import { createTestDatabase } from './helpers/d1';

const ORIGIN = 'https://counter.example.com';
const API = '/api/counters/github/readme';
const SVG = '/counters/github/readme.svg';

let database: ReturnType<typeof createTestDatabase>;
let env: Env;
let assetsRead: string[];

beforeEach(() => {
  database = createTestDatabase();
  assetsRead = [];
  env = {
    DB: database.db,
    ASSETS: {
      async fetch(input: RequestInfo | URL) {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
        );

        assetsRead.push(url.pathname);

        if (url.pathname.startsWith('/theme-data/')) {
          const file = new URL(
            `../docs/public${url.pathname}`,
            import.meta.url,
          );

          return new Response(await readFile(file), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Documentation', {
          headers: { 'Content-Type': 'text/html' },
        });
      },
    } as unknown as Fetcher,
  };
});

afterEach(() => {
  database.sqlite.close();
});

function request(path = API, method = 'GET', ip?: string) {
  return worker.fetch(
    new Request(`${ORIGIN}${path}`, {
      method,
      ...(ip ? { headers: { 'CF-Connecting-IP': ip } } : {}),
    }),
    env,
  );
}

describe('JSON API', () => {
  test('reads are side-effect free and missing counters return 404', async () => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Counter not found' });
    expect(database.sqlite.query('SELECT * FROM counters').all()).toEqual([]);
    expect(assetsRead).toEqual([]);
  });

  test('creates with 201 and Location, then records and reads with 200', async () => {
    const created = await request(API, 'POST', '192.0.2.1');

    expect(created.status).toBe(201);
    expect(created.headers.get('Location')).toBe(API);
    expect(await created.json()).toEqual({ visit: 1, visitor: 1 });

    const read = await request();

    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ visit: 1, visitor: 1 });

    const repeated = await request(API, 'POST', '192.0.2.1');

    expect(repeated.status).toBe(200);
    expect(repeated.headers.has('Location')).toBe(false);
    expect(await repeated.json()).toEqual({ visit: 2, visitor: 1 });
    expect(await (await request(API, 'POST', '192.0.2.2')).json()).toEqual({
      visit: 3,
      visitor: 2,
    });
    expect(await (await request(API, 'POST')).json()).toEqual({
      visit: 4,
      visitor: 2,
    });
  });

  test('stores stable SHA-256 fingerprints instead of raw IPs', async () => {
    await request(API, 'POST', '192.0.2.1');
    await request(API, 'POST', '192.0.2.1');
    await request('/api/counters/other/readme', 'POST', '192.0.2.1');

    const rows = database.sqlite
      .query<{ fingerprint: Uint8Array }, []>(
        'SELECT fingerprint FROM visitors',
      )
      .all();

    expect(rows).toHaveLength(2);
    expect(rows[0]?.fingerprint).toBeInstanceOf(Uint8Array);
    expect(rows[0]?.fingerprint).toHaveLength(32);
    expect(rows[0]?.fingerprint).toEqual(rows[1]?.fingerprint);
    expect(rows[0]?.fingerprint).toEqual(
      new Uint8Array(createHash('sha256').update('192.0.2.1').digest()),
    );
    expect(JSON.stringify(rows)).not.toContain('192.0.2.1');
  });

  test('does not trust X-Forwarded-For as the visitor identity', async () => {
    const response = await worker.fetch(
      new Request(`${ORIGIN}${API}`, {
        method: 'POST',
        headers: { 'X-Forwarded-For': '192.0.2.1' },
      }),
      env,
    );

    expect(await response.json()).toEqual({ visit: 1, visitor: 0 });
  });

  test('handles encoded identifiers without delimiter collisions', async () => {
    const first = '/api/counters/a%3Ab/c';
    const second = '/api/counters/a/b%3Ac';

    expect((await request(first, 'POST')).status).toBe(201);
    expect((await request(second, 'POST')).status).toBe(201);
    expect(await (await request(first)).json()).toEqual({
      visit: 1,
      visitor: 0,
    });
    expect(await (await request(second)).json()).toEqual({
      visit: 1,
      visitor: 0,
    });
    expect(
      (
        await request(
          '/api/counters/%E5%8D%9A%E5%AE%A2/%E9%A6%96%E9%A1%B5',
          'POST',
        )
      ).status,
    ).toBe(201);
  });
});

describe('image tracking', () => {
  test('records SVG requests and renders the counter as a self-contained image', async () => {
    const response = await request(`${SVG}?theme=capoo-2`, 'GET', '192.0.2.1');
    const svg = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'image/svg+xml; charset=utf-8',
    );
    expect(svg).toContain('data:image/png;base64,');
    expect(svg).toContain('glyph-_start');
    expect(svg).toContain('glyph-_end');
    expect(svg).toContain('Visits: 1');
    expect(assetsRead).toEqual(['/theme-data/capoo-2.json']);
    expect(await (await request()).json()).toEqual({ visit: 1, visitor: 1 });
  });

  test('mode=read and HEAD never increment counts', async () => {
    expect((await request(`${SVG}?mode=read`)).status).toBe(404);
    expect((await request(SVG, 'HEAD')).status).toBe(404);
    await request(API, 'POST', '192.0.2.1');

    const preview = await request(`${SVG}?mode=read`);
    const head = await request(SVG, 'HEAD', '192.0.2.2');

    expect(preview.status).toBe(200);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(await (await request()).json()).toEqual({ visit: 1, visitor: 1 });
  });

  test('missing image assets fail before a visit is recorded', async () => {
    env.ASSETS = {
      fetch: async () => new Response(null, { status: 404 }),
    } as unknown as Fetcher;
    const log = spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect((await request(SVG)).status).toBe(500);
      expect(database.sqlite.query('SELECT * FROM counters').all()).toEqual([]);
    } finally {
      log.mockRestore();
    }
  });
});

describe('HTTP semantics', () => {
  test.each([
    [API, 'GET, HEAD, POST, OPTIONS'],
    [SVG, 'GET, HEAD, OPTIONS'],
  ])(
    'OPTIONS and unsupported methods on %s do not touch storage',
    async (path, allow) => {
      env.DB = {
        prepare: () => {
          throw new Error('Database must not be accessed');
        },
      } as unknown as D1Database;
      const options = await request(path, 'OPTIONS');
      const rejected = await request(path, 'DELETE');

      expect(options.status).toBe(204);
      expect(await options.text()).toBe('');
      expect(options.headers.get('Access-Control-Allow-Methods')).toBe(allow);
      expect(rejected.status).toBe(405);
      expect(rejected.headers.get('Allow')).toBe(allow);
      expect(assetsRead).toEqual([]);
    },
  );

  test.each([
    `${API}?mode=read`,
    `${SVG}?mode=typo`,
    `${SVG}?theme=unknown`,
    `${SVG}?theme=__proto__`,
    `${SVG}?theme=moebooru&theme=miku`,
    `${SVG}?other=value`,
    '/counters/github/..svg',
    '/counters/github/...svg',
    '/api/counters/bad%2Fname/readme',
    '/api/counters/bad%5Cname/readme',
    '/api/counters/bad%00name/readme',
    '/api/counters/%ZZ/readme',
    '/api/counters/%20/readme',
    `/api/counters/${'a'.repeat(129)}/readme`,
  ])('rejects invalid input without recording: %s', async path => {
    const response = await request(path);

    expect(response.status).toBe(400);
    expect(database.sqlite.query('SELECT * FROM counters').all()).toEqual([]);
    expect(assetsRead).toEqual([]);
  });

  test('rejects POST bodies without recording', async () => {
    const response = await worker.fetch(
      new Request(`${ORIGIN}${API}`, { method: 'POST', body: '{}' }),
      env,
    );

    expect(response.status).toBe(400);
    expect(database.sqlite.query('SELECT * FROM counters').all()).toEqual([]);
  });

  test('accepts empty POST streams, including zero-length chunks', async () => {
    for (const body of [
      '',
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array());
          controller.close();
        },
      }),
    ]) {
      const response = await worker.fetch(
        new Request(`${ORIGIN}${API}`, { method: 'POST', body }),
        env,
      );

      expect(response.status).toBe(body === '' ? 201 : 200);
    }

    expect(await (await request()).json()).toEqual({ visit: 2, visitor: 0 });
  });

  test('stops reading a nonempty POST stream before persistence', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array());
        controller.enqueue(new Uint8Array([1]));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = await worker.fetch(
      new Request(`${ORIGIN}${API}`, { method: 'POST', body }),
      env,
    );

    expect(response.status).toBe(400);
    expect(cancelled).toBe(true);
    expect(database.sqlite.query('SELECT * FROM counters').all()).toEqual([]);
  });

  test.each([
    '/api/counters/github',
    '/api/counters/github/readme/extra',
    '/counters/github/readme.json',
  ])('returns 404 for unknown dynamic routes: %s', async path => {
    expect((await request(path)).status).toBe(404);
  });

  test('HEAD suppresses success and error bodies and has no side effects', async () => {
    for (const path of [API, `${SVG}?mode=typo`, '/api/unknown']) {
      const response = await request(path, 'HEAD');

      expect(response.status).toBe(path.includes('typo') ? 400 : 404);
      expect(await response.text()).toBe('');
    }

    await request(API, 'POST');

    const response = await request(API, 'HEAD');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(await (await request()).json()).toEqual({ visit: 1, visitor: 0 });
  });

  test.each([
    ['D1_ERROR: no such table: counters', 500],
    ['D1_ERROR: D1 DB is overloaded. Too many requests queued.', 503],
    [
      'D1_ERROR: Internal error while starting up D1 DB storage caused object to be reset.',
      503,
    ],
    [
      'D1_ERROR: Internal error in D1 DB storage caused object to be reset.',
      503,
    ],
  ])(
    'maps provider failures without leaking details: %s',
    async (message, status) => {
      env.DB = {
        prepare: () => {
          throw new Error(message);
        },
      } as unknown as D1Database;
      const log = spyOn(console, 'error').mockImplementation(() => {});

      try {
        const response = await request();

        expect(response.status).toBe(status);
        expect(await response.text()).not.toContain('D1');
        expect(response.headers.has('Retry-After')).toBe(false);
      } finally {
        log.mockRestore();
      }
    },
  );

  test('dynamic success and error responses are not cached and allow CORS', async () => {
    const responses = [await request(), await request(API, 'POST')];

    for (const response of responses) {
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Expose-Headers')).toBe(
        'Location',
      );
    }
  });

  test('serves the documentation through Static Assets', async () => {
    const response = await request('/zh/');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Documentation');
    expect(assetsRead).toEqual(['/zh/']);
  });
});
