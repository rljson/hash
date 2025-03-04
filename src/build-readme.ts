// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { readFile, writeFile } from 'fs/promises';

const buildReadme = async () => {
  // Read README.public.md
  const readme = await readFile('README.public.md', 'utf-8');
  const example = await readFile('src/example.ts', 'utf-8');

  // Insert example.ts into README
  const key = '/// EXAMPLE';
  console.assert(readme.includes(key), 'README.public.md must include ' + key);
  let result = readme.replace(key, example);

  // Replace import
  const importKey = "import { h } from './hash.ts';";
  console.assert(
    example.includes(importKey),
    'example.ts must include ' + importKey,
  );
  result = result.replace(importKey, "import { h } from '@rljson/hash.ts';");

  //  Write result to dist/README.md
  await writeFile('dist/README.md', result);
};

await buildReadme();
