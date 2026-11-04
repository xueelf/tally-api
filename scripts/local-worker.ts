import { $ } from 'bun';
import { join } from 'node:path';

import {
  type V4WorkerOptionsShape,
  convertV4MiniflareOptions,
  Miniflare,
} from 'miniflare';
import {
  unstable_getMiniflareWorkerOptions,
  unstable_readConfig,
} from 'wrangler';

export async function startLocalWorker({
  persistTo,
  port,
  assetsDirectory,
}: {
  persistTo: string;
  port?: number;
  assetsDirectory?: string;
}): Promise<Miniflare> {
  const config = unstable_readConfig({ config: 'wrangler.jsonc' });

  const { main, define, workerOptions } = unstable_getMiniflareWorkerOptions(
    config,
    undefined,
    {
      overrides: assetsDirectory
        ? { assets: { directory: assetsDirectory } }
        : undefined,
    },
  );
  const {
    assets,
    bindings,
    compatibilityDate,
    compatibilityFlags,
    d1Databases,
  } = workerOptions as Pick<
    V4WorkerOptionsShape,
    | 'assets'
    | 'bindings'
    | 'compatibilityDate'
    | 'compatibilityFlags'
    | 'd1Databases'
  >;
  const {
    outputs: [bundle],
  } = await Bun.build({
    entrypoints: [main!],
    target: 'browser',
    define,
  });

  await $`bun run db:migrate:local --persist-to ${persistTo}`.quiet();

  return new Miniflare({
    ...convertV4MiniflareOptions({
      host: '127.0.0.1',
      port,
      // Wrangler 的本地迁移写入同一持久化目录下的 v3。
      resourcePersistencePath: join(persistTo, 'v3'),
      workers: [
        {
          name: config.name,
          modules: true,
          script: await bundle!.text(),
          compatibilityDate,
          compatibilityFlags,
          assets,
          d1Databases,
          bindings,
          stripCfConnectingIp: false,
        },
      ],
    }),
    enableDevRegistry: false,
    telemetry: { enabled: false },
  });
}

if (import.meta.main) {
  const worker = await startLocalWorker({
    persistTo: '.wrangler/state',
    port: 8787,
  });

  try {
    console.log(`Counterflare: ${await worker.ready}`);
    await new Promise<void>(resolve => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });
  } finally {
    await worker.dispose();
  }
}
