import { readCounter, recordVisit } from './counters';
import { DEFAULT_THEME, hasTheme, loadTheme, renderCounter } from './svg';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'Location',
  'Cache-Control': 'no-store',
};

function errorResponse(
  status: number,
  error: string,
  headers: Record<string, string> = {},
) {
  return Response.json(
    { error },
    { status, headers: { ...HEADERS, ...headers } },
  );
}

function validName(value: string): boolean {
  return (
    value.length <= 128 &&
    value.trim().length > 0 &&
    value !== '.' &&
    value !== '..' &&
    !/[/\\\p{Cc}]/u.test(value)
  );
}

async function hasRequestBody(request: Request): Promise<boolean> {
  if (!request.body) {
    return false;
  }

  /*
   * Workers 可能将无请求体的 POST 表示为空流。
   * 流结束前跳过空块，遇到非空块时退出迭代并取消读取。
   */
  for await (const chunk of request.body) {
    if (chunk.byteLength > 0) {
      return true;
    }
  }

  return false;
}

async function visitorFingerprint(
  request: Request,
): Promise<Uint8Array | null> {
  const ip = request.headers.get('CF-Connecting-IP');

  if (!ip) {
    return null;
  }

  /*
   * 只保存 IP 的 SHA-256 指纹，不保存原始 IP。
   */
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip),
  );

  return new Uint8Array(digest);
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const api = /^\/api\/counters\/([^/]+)\/([^/]+)$/.exec(url.pathname);
  const route = api ?? /^\/counters\/([^/]+)\/([^/]+)\.svg$/.exec(url.pathname);

  if (!route) {
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/counters/')
    ) {
      return errorResponse(404, 'Not found');
    }

    return env.ASSETS.fetch(request);
  }

  const isImage = !api;
  const methods = isImage
    ? ['GET', 'HEAD', 'OPTIONS']
    : ['GET', 'HEAD', 'POST', 'OPTIONS'];
  const allow = methods.join(', ');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...HEADERS,
        Allow: allow,
        'Access-Control-Allow-Methods': allow,
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (!methods.includes(request.method)) {
    return errorResponse(405, 'Method not allowed', { Allow: allow });
  }

  let namespace: string;
  let name: string;

  try {
    namespace = decodeURIComponent(route[1]!);
    name = decodeURIComponent(route[2]!);
  } catch {
    return errorResponse(400, 'Invalid URL encoding');
  }

  if (!validName(namespace) || !validName(name)) {
    return errorResponse(400, 'Invalid namespace or counter name');
  }

  for (const parameter of url.searchParams.keys()) {
    if (
      !isImage ||
      !['theme', 'mode'].includes(parameter) ||
      url.searchParams.getAll(parameter).length !== 1
    ) {
      return errorResponse(400, 'Unknown or repeated query parameter');
    }
  }

  const mode = url.searchParams.get('mode');
  const themeName = url.searchParams.get('theme') ?? DEFAULT_THEME;

  if (isImage && mode !== null && mode !== 'read') {
    return errorResponse(400, 'Invalid mode; use mode=read or omit it');
  }

  if (isImage && !hasTheme(themeName)) {
    return errorResponse(400, 'Unknown theme');
  }

  if (await hasRequestBody(request)) {
    return errorResponse(400, 'This endpoint does not accept a request body');
  }

  /*
   * 先加载主题资源，再记录访问。
   * 避免主题缺失时计数已递增，却无法返回图片。
   */
  const theme = isImage
    ? await loadTheme(env.ASSETS, themeName, url.origin)
    : null;
  const recording =
    request.method === 'POST' ||
    (isImage && request.method === 'GET' && mode !== 'read');
  const counter = recording
    ? await recordVisit(
        env.DB,
        namespace,
        name,
        await visitorFingerprint(request),
      )
    : await readCounter(env.DB, namespace, name);

  if (!counter) {
    return errorResponse(404, 'Counter not found');
  }

  if (theme) {
    return new Response(renderCounter(counter.visit, theme), {
      headers: { ...HEADERS, 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  }

  // 只有记录访问才能创建计数器，因此 visit 为 1 时表示本次创建。
  const created = request.method === 'POST' && counter.visit === 1;

  return Response.json(counter, {
    status: created ? 201 : 200,
    headers: {
      ...HEADERS,
      ...(created ? { Location: url.pathname } : {}),
    },
  });
}

function temporarilyUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const { message } = error;

  // D1 将临时故障的原因写在错误消息里。
  return [
    'Network connection lost',
    'D1 DB is overloaded',
    'D1 DB reset because its code was updated',
    'D1 DB storage caused object to be reset',
    'Cannot resolve D1 DB due to transient issue',
    "exceeded D1's free tier daily",
  ].some(reason => message.includes(reason));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let response: Response;

    try {
      response = await handleRequest(request, env);
    } catch (error) {
      console.error('Counterflare request failed', error);

      response = temporarilyUnavailable(error)
        ? errorResponse(503, 'Service temporarily unavailable')
        : errorResponse(500, 'Internal server error');
    }

    return request.method === 'HEAD'
      ? new Response(null, {
          status: response.status,
          headers: response.headers,
        })
      : response;
  },
} satisfies ExportedHandler<Env>;
