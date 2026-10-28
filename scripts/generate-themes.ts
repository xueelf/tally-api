import {
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import { type Theme } from '../src/worker/svg';

function imageSize(buffer: Buffer, extension: string, file: string) {
  let width: number;
  let height: number;

  if (
    extension === 'png' &&
    buffer.length >= 33 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    buffer.readUInt32BE(8) === 13 &&
    buffer.toString('ascii', 12, 16) === 'IHDR'
  ) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  } else if (
    extension === 'gif' &&
    buffer.length >= 13 &&
    /^(GIF87a|GIF89a)$/.test(buffer.toString('ascii', 0, 6))
  ) {
    width = buffer.readUInt16LE(6);
    height = buffer.readUInt16LE(8);
  } else {
    throw new Error(`Unsupported or invalid image: ${file}`);
  }

  if (width === 0 || height === 0) {
    throw new Error(`Image dimensions must be positive: ${file}`);
  }

  return { width, height };
}

export function generateThemes(
  root = resolve(import.meta.dir, '..'),
): string[] {
  const source = join(root, 'docs/public/theme');
  const destination = join(root, 'docs/public/theme-data');
  const themes = new Map<string, Theme>();

  for (const directory of readdirSync(source, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, 'en'),
  )) {
    if (
      !directory.isDirectory() ||
      !/^[a-z0-9][a-z0-9-]*$/.test(directory.name)
    ) {
      throw new Error(`Invalid theme directory: ${directory.name}`);
    }

    const theme: Theme = {};
    const themePath = join(source, directory.name);

    for (const entry of readdirSync(themePath, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name, 'en'),
    )) {
      const match = /^([0-9]|_start|_end)\.(png|gif)$/.exec(entry.name);
      const character = match?.[1];
      const extension = match?.[2];
      const file = join(themePath, entry.name);

      if (!entry.isFile() || !character || !extension) {
        throw new Error(`Invalid theme image: ${file}`);
      }

      if (theme[character]) {
        throw new Error(`Duplicate theme character: ${file}`);
      }

      const buffer = readFileSync(file);

      theme[character] = {
        ...imageSize(buffer, extension, file),
        dataUri: `data:image/${extension};base64,${buffer.toString('base64')}`,
      };
    }

    for (const digit of '0123456789') {
      if (!theme[digit]) {
        throw new Error(`Missing digit ${digit} in theme ${directory.name}`);
      }
    }

    themes.set(directory.name, theme);
  }

  if (themes.size === 0) {
    throw new Error('No counter themes found');
  }

  mkdirSync(destination, { recursive: true });
  mkdirSync(join(root, 'src/generated'), { recursive: true });

  for (const file of readdirSync(destination)) {
    if (file.endsWith('.json') && !themes.has(file.slice(0, -5))) {
      unlinkSync(join(destination, file));
    }
  }

  for (const [name, theme] of themes) {
    writeFileSync(
      join(destination, `${name}.json`),
      `${JSON.stringify(theme)}\n`,
    );
  }

  const names = [...themes.keys()];

  writeFileSync(
    join(root, 'src/generated/themes.json'),
    `${JSON.stringify(names, null, 2)}\n`,
  );

  return names;
}

if (import.meta.main) {
  console.log(`Generated ${generateThemes().length} counter themes.`);
}
