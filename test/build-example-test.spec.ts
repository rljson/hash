// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { exec } from 'child_process';
import { describe, it } from 'vitest';

describe('build-readme.ts', () => {
  it('should insert example into README.public.md and write the result to dist/README.md', () => {
    // Open a terminal and run »npx vite-node src/build-readme.ts«
    // Check the dist/README.md file
    // The README.public.md file should be read
    // The example should be inserted
    // The result should be written to dist/README.md

    exec(
      'npx vite-node src/build-readme.ts',
      (error: any, stdout: any, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      },
    );
  });
});
