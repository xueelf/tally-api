// Theme registry: keep this in sync with docs/public/theme/<theme>/
const THEMES = {
  '3d-num': { ext: 'gif', mime: 'image/gif' },
  'ai-1': { ext: 'png', mime: 'image/png' },
  asoul: { ext: 'gif', mime: 'image/gif' },
  'booru-ffsr': { ext: 'gif', mime: 'image/gif' },
  'booru-helltaker': { ext: 'gif', mime: 'image/gif' },
  'booru-huggboo': { ext: 'gif', mime: 'image/gif' },
  'booru-jaypee': { ext: 'gif', mime: 'image/gif' },
  'booru-koe': { ext: 'gif', mime: 'image/gif' },
  'booru-lewd': { ext: 'gif', mime: 'image/gif' },
  'booru-lisu': { ext: 'gif', mime: 'image/gif' },
  'booru-mjg': { ext: 'gif', mime: 'image/gif' },
  'booru-mof': { ext: 'gif', mime: 'image/gif' },
  'booru-nandroid': { ext: 'gif', mime: 'image/gif' },
  'booru-qualityhentais': { ext: 'gif', mime: 'image/gif' },
  'booru-r6gdrawfriends': { ext: 'gif', mime: 'image/gif' },
  'booru-rfck': { ext: 'gif', mime: 'image/gif' },
  'booru-smtg': { ext: 'gif', mime: 'image/gif' },
  'booru-snyde': { ext: 'gif', mime: 'image/gif' },
  'booru-the-collection': { ext: 'gif', mime: 'image/gif' },
  'booru-touhoulat': { ext: 'gif', mime: 'image/gif' },
  'booru-townofgravityfalls': { ext: 'gif', mime: 'image/gif' },
  'booru-twifanartsfw': { ext: 'gif', mime: 'image/gif' },
  'booru-ve': { ext: 'gif', mime: 'image/gif' },
  'booru-vivi': { ext: 'gif', mime: 'image/gif' },
  'booru-vp': { ext: 'gif', mime: 'image/gif' },
  'booru-yuyuyui': { ext: 'gif', mime: 'image/gif' },
  'capoo-1': { ext: 'png', mime: 'image/png' },
  'capoo-2': { ext: 'png', mime: 'image/png' },
  e621: { ext: 'gif', mime: 'image/gif' },
  food: { ext: 'gif', mime: 'image/gif' },
  gelbooru: { ext: 'gif', mime: 'image/gif' },
  'gelbooru-h': { ext: 'png', mime: 'image/png' },
  green: { ext: 'gif', mime: 'image/gif' },
  'kasuterura-1': { ext: 'gif', mime: 'image/gif' },
  'kasuterura-2': { ext: 'gif', mime: 'image/gif' },
  'kasuterura-3': { ext: 'gif', mime: 'image/gif' },
  'kasuterura-4': { ext: 'gif', mime: 'image/gif' },
  kyun: { ext: 'gif', mime: 'image/gif' },
  'love-and-deepspace': { ext: 'png', mime: 'image/png' },
  miku: { ext: 'png', mime: 'image/png' },
  minecraft: { ext: 'gif', mime: 'image/gif' },
  moebooru: { ext: 'gif', mime: 'image/gif' },
  'moebooru-h': { ext: 'png', mime: 'image/png' },
  'morden-num': { ext: 'gif', mime: 'image/gif' },
  'nixietube-1': { ext: 'gif', mime: 'image/gif' },
  'nixietube-2': { ext: 'gif', mime: 'image/gif' },
  'normal-1': { ext: 'gif', mime: 'image/gif' },
  'normal-2': { ext: 'gif', mime: 'image/gif' },
  'original-new': { ext: 'gif', mime: 'image/gif' },
  'original-old': { ext: 'gif', mime: 'image/gif' },
  rule34: { ext: 'gif', mime: 'image/gif' },
  shimmie2: { ext: 'gif', mime: 'image/gif' },
  'sketch-1': { ext: 'png', mime: 'image/png' },
  'sketch-2': { ext: 'png', mime: 'image/png' },
  'yousa-ling': { ext: 'gif', mime: 'image/gif' },
} as const;

type Theme = keyof typeof THEMES;
type CounterFormat = 'json' | 'svg';
type CounterEnv = Env & {
  ASSETS: {
    fetch(input: Request): Promise<Response>;
  };
};

const CORS: Record<string, string> = { 'Access-Control-Allow-Origin': '*' };
const NO_CACHE: Record<string, string> = {
  'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

function isValidTheme(value: string): value is Theme {
  return value in THEMES;
}

function parseResource(
  rawResource: string,
): { resource: string; format: CounterFormat } | null {
  const dot = rawResource.lastIndexOf('.');

  if (dot > 0) {
    const ext = rawResource.slice(dot + 1);

    if (ext === 'svg' || ext === 'json') {
      return { resource: rawResource.slice(0, dot), format: ext };
    }
  }
  return rawResource ? { resource: rawResource, format: 'json' } : null;
}

// Read image dimensions directly from binary headers (no extra dependencies needed)
function readImageDimensions(
  buffer: ArrayBuffer,
  ext: 'gif' | 'png',
): { width: number; height: number } {
  const view = new DataView(buffer);

  if (ext === 'gif') {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export const onRequest: PagesFunction<CounterEnv> = async context => {
  const { request, env, params } = context;
  const { id: rawId, resource: rawResource } = params;

  if (typeof rawId !== 'string' || typeof rawResource !== 'string') {
    return Response.json(
      { error: 'Missing id or resource' },
      { status: 400, headers: CORS },
    );
  }
  const parsed = parseResource(rawResource);

  if (!parsed) {
    return Response.json(
      { error: 'Invalid resource' },
      { status: 400, headers: CORS },
    );
  }
  const { resource, format } = parsed;
  const { searchParams } = new URL(request.url);
  const isReadOnly = searchParams.get('mode') === 'read';

  const prefix = `hits:${rawId}:${resource}`;
  const visitKey = `${prefix}:visit`;
  const visitorKey = `${prefix}:visitor`;

  const clientIp = isReadOnly ? null : request.headers.get('CF-Connecting-IP');
  const ipKey = clientIp ? `${prefix}:ip:${clientIp}` : null;
  const [storedVisit, storedVisitor, seen] = await Promise.all([
    env.KV.get(visitKey),
    env.KV.get(visitorKey),
    ipKey ? env.KV.get(ipKey) : null,
  ]);

  let visit = Number.parseInt(storedVisit ?? '0', 10);
  let visitor = Number.parseInt(storedVisitor ?? '0', 10);

  if (!isReadOnly) {
    visit += 1;

    const writes: Promise<unknown>[] = [env.KV.put(visitKey, visit.toString())];

    if (ipKey && !seen) {
      visitor += 1;

      writes.push(
        env.KV.put(visitorKey, visitor.toString()),
        env.KV.put(ipKey, Date.now().toString()),
      );
    }
    await Promise.all(writes);
  }

  if (format === 'json') {
    return Response.json({ visit, visitor }, { headers: NO_CACHE });
  }
  const themeParam = searchParams.get('theme') ?? 'moebooru';
  const theme: Theme = isValidTheme(themeParam) ? themeParam : 'moebooru';
  const { ext, mime } = THEMES[theme];
  const digits = visit.toString().padStart(7, '0').split('');
  const digitData = new Map<
    string,
    { width: number; height: number; dataUri: string }
  >();

  await Promise.all(
    [...new Set(digits)].map(async digit => {
      const response = await env.ASSETS.fetch(
        new Request(new URL(`/theme/${theme}/${digit}.${ext}`, request.url)),
      );

      if (!response.ok) {
        return;
      }
      const buffer = await response.arrayBuffer();
      const { width, height } = readImageDimensions(buffer, ext);
      const binary = Array.from(new Uint8Array(buffer), value =>
        String.fromCharCode(value),
      ).join('');

      digitData.set(digit, {
        width,
        height,
        dataUri: `data:${mime};base64,${btoa(binary)}`,
      });
    }),
  );

  const defs: string[] = [];
  const uses: string[] = [];
  const emitted = new Set<string>();

  let svgWidth = 0;
  let svgHeight = 0;

  for (const digit of digits) {
    const image = digitData.get(digit);

    if (!image) {
      continue;
    }

    if (!emitted.has(digit)) {
      emitted.add(digit);
      defs.push(
        `    <image id="${digit}" width="${image.width}" height="${image.height}" xlink:href="${image.dataUri}" />`,
      );
    }
    uses.push(`    <use x="${svgWidth}" xlink:href="#${digit}" />`);

    svgWidth += image.width;

    if (image.height > svgHeight) {
      svgHeight = image.height;
    }
  }

  const svg = [
    `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`,
    `  <style>`,
    `    svg { image-rendering: pixelated; }`,
    `    @media (prefers-color-scheme: dark) { svg { filter: brightness(.6); } }`,
    `  </style>`,
    `  <defs>`,
    ...defs,
    `  </defs>`,
    `  <g>`,
    ...uses,
    `  </g>`,
    `</svg>`,
  ].join('\n');

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      ...NO_CACHE,
    },
  });
};
