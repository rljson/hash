# @rljson/hash

`@rljson/hash` is a lightweight package designed to traverse JSON data
structures and add unique hash identifiers to all objects within them.

![teaser.webp](https://github.com/rljson/hash/raw/main/teaser.webp)

## Motivation

Hashing nested JSON objects makes sense for several key reasons:

- **Change Detection**: By generating a unique hash for each object, you can easily
  detect changes in complex data structures without manually comparing all
  fields.
- **Efficient Synchronization**: Hashes allow systems to sync only modified or new
  data, reducing bandwidth and improving performance.
- **Cache Management**: Hashes act as unique keys for caching, enabling quick
  retrieval and ensuring data consistency.
- **Data Integrity**: Hashes verify that nested objects remain unaltered, adding an
  extra layer of security and reliability.
- **Simplified Tracking**: In complex systems, hashes provide a consistent way to
  identify and track objects, even across distributed environments.

## Features

- **Recursive Processing**: Add hashes to nested JSON objects.
- **SHA256** Uses SHA256 algorithm for hashing.
- **Hash truncation** Specify the length of the added hashes.
- **Non-Intrusive**: If desired, add hashes without altering existing data.
- **Floating points**: Assign same hashes to similar floating point numbers

## Example

[src/example.ts](src/example.ts)
