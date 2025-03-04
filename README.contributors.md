# Contributors

## Important

⚠️ IMPORTANT: On `Windows, please checkout the repo on drive C`.
There is a bug in the Vscode vitest extension v 1.14.4, making debugging tests
not work. <https://github.com/vitest-dev/vscode/issues/548>
Please check from time to time, if the issue is fixed and remove this hint.

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
