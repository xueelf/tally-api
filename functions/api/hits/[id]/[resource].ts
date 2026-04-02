// Theme registry: add new themes here with their asset extension
const THEMES = {
  moebooru: { ext: 'gif', mime: 'image/gif' },
  'moebooru-h': { ext: 'png', mime: 'image/png' },
} as const;

type Theme = keyof typeof THEMES;

function isValidTheme(value: string): value is Theme {
  return value in THEMES;
}

// Read image dimensions directly from binary headers (no extra dependencies needed)
function readImageDimensions(
  buffer: ArrayBuffer,
  ext: 'gif' | 'png',
): { width: number; height: number } {
  const view = new DataView(buffer);

  if (ext === 'gif') {
    // GIF: logical screen descriptor at bytes 6–9, little-endian
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  // PNG: IHDR chunk starts at byte 8; width/height at bytes 16–23, big-endian
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

const CORS: Record<string, string> = { 'Access-Control-Allow-Origin': '*' };
const NO_CACHE: Record<string, string> = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env, params } = context;
  const { id: rawId, resource: rawResource } = params;

  if (typeof rawId !== 'string' || typeof rawResource !== 'string') {
    return Response.json(
      { error: 'Missing id or resource' },
      { status: 400, headers: CORS },
    );
  }

  const match = rawResource.match(/^(.+?)(?:\.(json|svg))?$/);

  if (!match) {
    return Response.json(
      { error: 'Invalid resource' },
      { status: 400, headers: CORS },
    );
  }
  const [, resource, formatExt] = match;
  const format = formatExt ?? 'json';

  const kvKey = `hits:${rawId}:${resource}`;
  const stored = await env.KV_TALLY.get(kvKey);
  const count = (stored ? parseInt(stored, 10) : 0) + 1;

  // Non-blocking write: deferred via waitUntil so TTFB is not penalised
  context.waitUntil(env.KV_TALLY.put(kvKey, count.toString()));

  if (format === 'json') {
    return Response.json({ count }, { headers: NO_CACHE });
  }

  if (format === 'svg') {
    const { searchParams } = new URL(request.url);
    const themeParam = searchParams.get('theme') ?? 'moebooru';
    const theme: Theme = isValidTheme(themeParam) ? themeParam : 'moebooru';
    const { ext, mime } = THEMES[theme];

    const digits = count.toString().padStart(7, '0').split('');
    const uniqueDigits = [...new Set(digits)];

    // Fetch only unique digit images in parallel – avoids duplicating identical base64 blobs in SVG
    const digitData = new Map<
      string,
      { width: number; height: number; dataUri: string }
    >();

    await Promise.all(
      uniqueDigits.map(async digit => {
        const res = await env.ASSETS.fetch(
          new Request(new URL(`/theme/${theme}/${digit}.${ext}`, request.url)),
        );

        if (!res.ok) {
          return;
        }
        const buffer = await res.arrayBuffer();
        const { width, height } = readImageDimensions(buffer, ext);
        const binary = Array.from(new Uint8Array(buffer), b =>
          String.fromCharCode(b),
        ).join('');

        digitData.set(digit, {
          width,
          height,
          dataUri: `data:${mime};base64,${btoa(binary)}`,
        });
      }),
    );

    // <defs>: one <image> per unique digit (matches moe-counter behaviour)
    const defs = uniqueDigits
      .filter(d => digitData.has(d))
      .map(d => {
        const { width, height, dataUri } = digitData.get(d)!;
        return `\n    <image id="${d}" width="${width}" height="${height}" xlink:href="${dataUri}" />`;
      })
      .join('');

    // <g>: <use> elements reference defs so shared digits cost nothing extra
    let svgWidth = 0;
    const uses = digits
      .filter(d => digitData.has(d))
      .map(d => {
        const { width } = digitData.get(d)!;
        const x = svgWidth;

        svgWidth += width;
        return `\n    <use x="${x}" xlink:href="#${d}" />`;
      })
      .join('');
    const svgHeight = Math.max(
      0,
      ...[...digitData.values()].map(d => d.height),
    );

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Moe Counter!</title>
  <style>
    svg { image-rendering: pixelated; }
    @media (prefers-color-scheme: dark) { svg { filter: brightness(.6); } }
  </style>
  <defs>${defs}
  </defs>
  <g>${uses}
  </g>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ...NO_CACHE,
      },
    });
  }

  return Response.json(
    { error: 'Unsupported format' },
    { status: 400, headers: CORS },
  );
};
