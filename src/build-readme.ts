// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { mkdir, readFile, writeFile } from 'fs/promises';

const importKey = "import { Hash, hip, hsh } from './index.ts';";

export const buildReadme = async () => {
  // Read README.public.md
  const readme = await readFile('README.public.md', 'utf-8');
  const example = await readFile('src/example.ts', 'utf-8');

  // Insert example.ts into README
  const key = '[src/example.ts](src/example.ts)';
  console.assert(readme.includes(key), 'README.public.md must include ' + key);
  let result = readme.replace(
    key,
    ['```typescript', example, '```'].join('\n'),
  );

  // Replace import

  /* v8 ignore start */
  if (!example.includes(importKey)) {
    throw new Error('example.ts must include ' + importKey);
  }
  /* v8 ignore stop */

  result = result.replace(importKey, "import { h } from '@rljson/hash';");

  // Create dist if not existing
  /* v8 ignore start */
  try {
    await mkdir('dist');
  } catch {
  } finally {
  }
  /* v8 ignore stop */

  //  Write result to dist/README.md
  await writeFile('dist/README.md', result);
};
