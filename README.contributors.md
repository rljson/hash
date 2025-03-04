# Contributors

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
