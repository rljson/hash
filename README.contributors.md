# Contributors

## Important

⚠️ IMPORTANT: On `Windows, please checkout the repo on drive C`.
There is a bug in the Vscode vitest extension v 1.14.4, making debugging tests
not work. <https://github.com/vitest-dev/vscode/issues/548>
Please check from time to time, if the issue is fixed and remove this hint.

## Report issues

Visit <https://github.com/rljson/hash/issues>

Check if there is already an issue for your problem

If no, report the issue

## Check out

```bash
mkdir rljson
cd rljson
git clone https://github.com/rljson/hash.git
cd hash
```

## Install dependencies

```bash
npm install
```

## Run the tests

```bash
npm run test
```

## Build the package

```bash
npm run build
```

## Publish the package

Open `package.json`.

Increase `version`.

Compile typescript:

```bash
npm run build
```

Make publish dry-run

```bash
npm publish --dry-run
```

## Architecture

Reade [README.architecture.md](./README.architecture.md) to get an overview
of the package's architecture.

## Install Vscode extensions

Open this project in `vscode`.

Press `Cmd+Shift+P`.

Type `Extensions: Show Recommended Extensions` and press `Enter`.

The recommended extensions will be shown.

Make sure, all recommended extensions are shown.

## Debug tests

In Vscode: At the `left side bar` click on the `Test tube` icon to open the `Test explorer`.

At the `top`, click on the `refresh` icon to show update the tests.

Open a test file, e.g. `server.spec.ts`.

Set a breakpoint.

Press `alt` and click on the play button left beside the test.

Execution should stop at the breakpoint.
