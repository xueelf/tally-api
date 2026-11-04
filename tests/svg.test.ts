import { beforeAll, describe, expect, test } from 'bun:test';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { generateThemes } from '../scripts/generate-themes';
import {
  type Theme,
  DEFAULT_THEME,
  hasTheme,
  loadTheme,
  renderCounter,
} from '../src/worker/svg';

let names: string[];

beforeAll(() => {
  names = generateThemes();
});

function readTheme(name: string): Theme {
  return JSON.parse(
    readFileSync(
      new URL(`../docs/public/theme-data/${name}.json`, import.meta.url),
      'utf8',
    ),
  ) as Theme;
}

describe('theme assets', () => {
  test('builds all 55 themes with complete embedded digits', () => {
    expect(names).toHaveLength(55);
    expect(names).toContain(DEFAULT_THEME);

    let characters = 0;

    for (const name of names) {
      expect(hasTheme(name)).toBe(true);

      const theme = readTheme(name);

      for (const digit of '0123456789') {
        expect(theme[digit]?.width).toBeGreaterThan(0);
        expect(theme[digit]?.height).toBeGreaterThan(0);
        expect(theme[digit]?.dataUri).toMatch(/^data:image\/(png|gif);base64,/);
      }

      characters += Object.keys(theme).length;
    }

    expect(characters).toBe(552);
    expect(hasTheme('__proto__')).toBe(false);
    expect(hasTheme('../moebooru')).toBe(false);
  });

  test.each([
    ['missing', 'Missing digit 9'],
    ['duplicate', 'Duplicate theme character'],
    ['unknown', 'Invalid theme image'],
    ['corrupt', 'Unsupported or invalid image'],
  ])('rejects %s source images during the build', (problem, message) => {
    const prefix = join(tmpdir(), 'counterflare-themes-');
    const root = mkdtempSync(prefix);
    const source = join(root, 'docs/public/theme/moebooru');

    if (!resolve(root).startsWith(resolve(prefix))) {
      throw new Error('Unexpected temporary theme directory');
    }

    try {
      cpSync(
        new URL('../docs/public/theme/moebooru', import.meta.url),
        source,
        {
          recursive: true,
        },
      );

      if (problem === 'missing') {
        unlinkSync(join(source, '9.gif'));
      } else if (problem === 'duplicate') {
        cpSync(join(source, '0.gif'), join(source, '0.png'));
      } else if (problem === 'unknown') {
        writeFileSync(join(source, 'extra.gif'), 'unexpected');
      } else {
        writeFileSync(join(source, '0.gif'), 'invalid');
      }

      expect(() => generateThemes(root)).toThrow(message);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('loads one generated static asset and rejects a failed fetch', async () => {
    const theme = readTheme(DEFAULT_THEME);
    const requested: string[] = [];
    let status = 200;
    const assets = {
      fetch(input: RequestInfo | URL) {
        requested.push(String(input));

        return Promise.resolve(Response.json(theme, { status }));
      },
    } as Fetcher;

    expect(
      await loadTheme(assets, DEFAULT_THEME, 'https://counter.example/path'),
    ).toEqual(theme);
    expect(requested).toEqual([
      'https://counter.example/theme-data/moebooru.json',
    ]);

    status = 404;

    await expect(
      loadTheme(assets, DEFAULT_THEME, 'https://counter.example'),
    ).rejects.toThrow('Could not load counter theme');
  });
});

describe('SVG counter', () => {
  test('embeds each repeated digit once and renders seven positions', () => {
    const svg = renderCounter(111, readTheme(DEFAULT_THEME));

    expect(svg.match(/<image /g)).toHaveLength(2);
    expect(svg.match(/<use /g)).toHaveLength(7);
    expect(svg).toContain('id="glyph-0"');
    expect(svg).toContain('id="glyph-1"');
    expect(svg).toContain('data:image/gif;base64,');
    expect(svg).toContain('<title id="counter-title">Visits: 111</title>');
    expect(svg).not.toContain('xlink:');
  });

  test('includes capoo-2 decorations and their dimensions', () => {
    const theme = readTheme('capoo-2');
    const svg = renderCounter(0, theme);
    const width =
      theme._start!.width + 7 * theme['0']!.width + theme._end!.width;
    const height = Math.max(
      theme._start!.height,
      theme['0']!.height,
      theme._end!.height,
    );

    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(svg.match(/<image /g)).toHaveLength(3);
    expect(svg.match(/<use /g)).toHaveLength(9);
    expect(svg.indexOf('<use href="#glyph-_start"')).toBeLessThan(
      svg.indexOf('<use href="#glyph-0"'),
    );
    expect(svg.indexOf('<use href="#glyph-_end"')).toBeGreaterThan(
      svg.lastIndexOf('<use href="#glyph-0"'),
    );
  });

  test('does not truncate the largest valid count', () => {
    const visit = Number.MAX_SAFE_INTEGER;
    const svg = renderCounter(visit, readTheme(DEFAULT_THEME));

    expect(svg.match(/<use /g)).toHaveLength(String(visit).length);
    expect(svg).toContain(`Visits: ${visit}`);
  });

  test('rejects invalid counts and incomplete themes', () => {
    const theme = readTheme(DEFAULT_THEME);

    for (const visit of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => renderCounter(visit, theme)).toThrow(RangeError);
    }

    delete theme['2'];
    expect(() => renderCounter(12, theme)).toThrow(
      'Missing counter character: 2',
    );
  });
});
