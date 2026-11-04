import themeNames from '../generated/themes.json';

interface Glyph {
  width: number;
  height: number;
  dataUri: string;
}

export type Theme = Record<string, Glyph>;

export const DEFAULT_THEME = 'moebooru';

const THEMES = new Set(themeNames);

export function hasTheme(name: string): boolean {
  return THEMES.has(name);
}

export async function loadTheme(
  assets: Fetcher,
  name: string,
  origin: string,
): Promise<Theme> {
  const response = await assets.fetch(
    new URL(`/theme-data/${name}.json`, origin),
  );

  if (!response.ok) {
    throw new Error(`Could not load counter theme: ${name}`);
  }

  return response.json<Theme>();
}

export function renderCounter(visit: number, theme: Theme): string {
  if (!Number.isSafeInteger(visit) || visit < 0) {
    throw new RangeError('Visit count must be a nonnegative safe integer');
  }

  const characters = String(visit).padStart(7, '0').split('');

  if (theme._start) {
    characters.unshift('_start');
  }

  if (theme._end) {
    characters.push('_end');
  }

  const definitions = new Map<string, string>();
  const instances: string[] = [];

  let width = 0;
  let height = 0;

  for (const character of characters) {
    const image = theme[character];

    if (!image) {
      throw new Error(`Missing counter character: ${character}`);
    }

    const id = `glyph-${character}`;

    if (!definitions.has(character)) {
      definitions.set(
        character,
        `<image id="${id}" width="${image.width}" height="${image.height}" href="${image.dataUri}"/>`,
      );
    }

    instances.push(`<use href="#${id}" x="${width}"/>`);
    width += image.width;
    height = Math.max(height, image.height);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="counter-title">`,
    `<title id="counter-title">Visits: ${visit}</title>`,
    '<style>svg{image-rendering:pixelated}@media(prefers-color-scheme:dark){svg{filter:brightness(.6)}}</style>',
    `<defs>${[...definitions.values()].join('')}</defs>`,
    `<g>${instances.join('')}</g>`,
    '</svg>',
  ].join('\n');
}
