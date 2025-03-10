import { Json } from '@rljson/json';

import { Hash, hip, hsh } from './index.ts';


/**
 * The example function demonstrates how to use rljson/hash
 */
export const example = () => {
  const print = console.log;
  const assert = console.assert;
  const h = Hash.default;

  // .............................................................................
  print('Create a json structure');

  let json: Json = {
    a: '0',
    b: '1',
    child: {
      d: 3,
      e: 4,
      _hash: '',
    },
    _hash: '',
  };

  // .............................................................................
  print('Add hashes to the json structure.');
  json = hsh(json);
  print(JSON.stringify(json, null, 2));

  // {
  //   "a": "0",
  //   "b": "1",
  //   "child": {
  //     "d": 3,
  //     "e": 4,
  //     "_hash": "nfTEHYDoqVPb3ieJSmBxft"
  //   },
  //   "_hash": "k-3v5I-Q6Q9vPdVJxsMYUk"
  // }

  // .............................................................................
  print('Set a maximum floating point precision.');

  try {
    hsh({
      a: 1.0000000001,
      _hash: '',
    });
  } catch (e: unknown) {
    print((e as Error).message); // Number 1.0000000001 has a higher precision than 0.001
  }

  // .............................................................................
  print('Use hash to modify the input object directly.');

  json = { a: 1, b: 2, _hash: '' };

  hip(json);
  assert(json._hash, 'QyWM_3g_5wNtikMDP4MK38');

  // .............................................................................
  print(
    'Set "upateExistingHashes: false" to create missing hashes but ' +
      'without touching existing ones.',
  );

  json = {
    a: 1,
    b: 2,
    child: { c: 3, _hash: '' },
    child2: { _hash: 'ABC123', d: 4 },
    _hash: '',
  };

  const result = hsh(json, {
    updateExistingHashes: false,
    throwOnWrongHashes: false,
  }) as any;
  assert(result._hash === 'cUSAvaoXAr3a7LojbHtVjE');
  assert(result.child._hash === 'yrqcsGrHfad4G4u9fgcAxY');
  assert(result.child2._hash === 'ABC123');

  // .............................................................................
  print('If existing hashes do not match new ones, an error is thrown.');
  try {
    h.apply({ a: 1, _hash: 'invalid' });
  } catch (e: unknown) {
    print((e as Error).message);
    // 'Hash "invalid" does not match the newly calculated one "AVq9f1zFei3ZS3WQ8ErYCE".
    // Please make sure that all systems are producing the same hashes.'
  }

  // .............................................................................
  print('Set "throwOnWrongHashes" to false to replace invalid hashes.');
  json = hsh({ a: 1, _hash: 'invalid' }, { throwOnWrongHashes: false });
  print(json._hash); // AVq9f1zFei3ZS3WQ8ErYCE

  // .............................................................................
  print('Use validate to check if the hashes are correct');

  json = { a: 1, b: 2, _hash: '' };
  json = hsh(json);

  h.validate(json); // true

  try {
    json.a = 3;
    h.validate({ a: 3, _hash: 'invalid' });
  } catch (e: unknown) {
    print((e as Error).message);
  }
};
