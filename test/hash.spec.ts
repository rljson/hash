// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { Json } from '@rljson/json';

import { beforeEach, describe, expect, it } from 'vitest';

import { defaultApplyConfig } from '../src/apply-config';
import { Hash, hip, hsh } from '../src/hash';

describe('Hash', () => {
  let jh = Hash.default;

  beforeEach(() => {
    jh = new Hash();
  });

  describe('apply(json)', () => {
    describe('adds correct hashes to', () => {
      describe('simple json', () => {
        describe('containing only one key value pair', () => {
          it('with a string value', () => {
            const json = jh.apply({ key: 'value', _hash: '' });
            expect(json.key).toEqual('value');
            const expectedHash = jh.calcHash('{"key":"value"}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
          });

          it('with a int value', () => {
            const json = jh.apply({ key: 1, _hash: '' });
            expect(json.key).toEqual(1);
            const expectedHash = jh.calcHash('{"key":1}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('t4HVsGBJblqznOBwy6IeLt');
          });

          it('with a double value without commas', () => {
            const json = jh.apply({ key: 1.0, _hash: '' });
            expect(json.key).toEqual(1);
            const expectedHash = jh.calcHash('{"key":1}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('t4HVsGBJblqznOBwy6IeLt');
          });

          it('with a bool value', () => {
            const json = jh.apply({ key: true, _hash: '' });
            expect(json.key).toEqual(true);
            const expectedHash = jh.calcHash('{"key":true}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('dNkCrIe79x2dPyf5fywwYO');
          });

          it('with a null value', () => {
            const json = jh.apply({ key: null, _hash: '' });
            expect(json.key).toEqual(null);
            const expectedHash = jh.calcHash('{"key":null}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('BZwS6bAVtKxSW0AW5y8ANk');
          });

          it('with an array with null values', () => {
            const json = jh.apply({ key: [1, 2, null, 3], _hash: '' });
            expect(json.key).toEqual([1, 2, null, 3]);
            const expectedHash = jh.calcHash('{"key":[1,2,null,3]}');
            expect(json._hash).toEqual(expectedHash);
            expect(json._hash).toEqual('TJBZ_lVlkDw6WlF8esM0I5');
          });
        });

        it('existing _hash should be overwritten', () => {
          const ac = defaultApplyConfig();
          ac.throwOnWrongHashes = false;

          const json = jh.apply(
            {
              key: 'value',
              _hash: 'oldHash',
            },
            ac,
          );
          expect(json.key).toEqual('value');
          const expectedHash = jh.calcHash('{"key":"value"}');
          expect(json._hash).toEqual(expectedHash);
          expect(json._hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
        });

        describe('containing three key value pairs', () => {
          const json0: Json = {
            a: 'value',
            b: 1.0,
            c: true,
            _hash: '',
          };

          const json1: Json = {
            b: 1.0,
            a: 'value',
            c: true,
            _hash: '',
          };

          let j0: Json;

          let j1: Json;

          beforeEach(() => {
            j0 = jh.apply(json0);
            j1 = jh.apply(json1);
          });

          it('should create a string of key value pairs and hash it', () => {
            const expectedHash = jh.calcHash('{"a":"value","b":1,"c":true}');

            expect(j0._hash).toEqual(expectedHash);
            expect(j1._hash).toEqual(expectedHash);
          });

          it('should sort work independent of key order', () => {
            expect(j0).toEqual(j1);
            expect(j0._hash).toEqual(j1._hash);
            expect(true.toString()).toEqual('true');
          });
        });
      });

      describe('nested json', () => {
        it('of level 1', () => {
          const parent = jh.apply({
            key: 'value',
            _hash: '',
            child: {
              key: 'value',
              _hash: '',
            },
          });

          const child = parent.child;
          const childHash = jh.calcHash('{"key":"value"}');
          expect(child._hash).toEqual(childHash);

          const parentHash = jh.calcHash(
            `{"child":"${childHash}","key":"value"}`,
          );

          expect(parent._hash).toEqual(parentHash);
        });

        it('of level 2', () => {
          const parent = jh.apply({
            _hash: '',
            key: 'value',
            child: {
              _hash: '',
              key: 'value',
              grandChild: {
                _hash: '',
                key: 'value',
              },
            },
          });

          const grandChild = parent.child.grandChild;
          const grandChildHash = jh.calcHash('{"key":"value"}');
          expect(grandChild._hash).toEqual(grandChildHash);

          const child = parent.child;
          const childHash = jh.calcHash(
            `{"grandChild":"${grandChildHash}","key":"value"}`,
          );
          expect(child._hash).toEqual(childHash);

          const parentHash = jh.calcHash(
            `{"child":"${childHash}","key":"value"}`,
          );
          expect(parent._hash).toEqual(parentHash);
        });
      });

      it('complete json example', () => {
        const json = JSON.parse(exampleJson);
        const hashedJson = jh.apply(json);

        const hashedJsonString = JSON.stringify(hashedJson, null, 2);
        expect(hashedJsonString).toEqual(exampleJsonWithHashes);
      });

      describe('data containing arrays', () => {
        describe('on top level', () => {
          describe('containing only simple types', () => {
            it('should convert all values to strings and hash it', () => {
              const json = jh.apply({
                key: ['value', 1.0, true],
                _hash: '',
              });

              const expectedHash = jh.calcHash('{"key":["value",1,true]}');

              expect(json._hash).toEqual(expectedHash);
              expect(json._hash).toEqual('nbNb1YfpgqnPfyFTyCQ5YF');
            });
          });

          describe('containing nested objects', () => {
            describe('should hash the nested objects', () => {
              describe('and use the hash instead of the stringified value', () => {
                it('with a complicated array', () => {
                  const json = jh.apply({
                    _hash: '',
                    array: [
                      'key',
                      1.0,
                      true,
                      { key1: 'value1', _hash: '' },
                      { key0: 'value0', _hash: '' },
                    ],
                  });

                  const h0 = jh.calcHash('{"key0":"value0"}');
                  const h1 = jh.calcHash('{"key1":"value1"}');
                  const expectedHash = jh.calcHash(
                    `{"array":["key",1,true,"${h1}","${h0}"]}`,
                  );

                  expect(json._hash).toEqual(expectedHash);
                  expect(json._hash).toEqual('13h_Z0wZCF4SQsTyMyq5dV');
                });

                it('with a simple array', () => {
                  const json = jh.apply({
                    _hash: '',
                    array: [{ key: 'value', _hash: '' }],
                  });

                  const itemHash = jh.calcHash('{"key":"value"}');
                  const array = json.array;
                  const item0 = array[0];
                  expect(item0._hash).toEqual(itemHash);
                  expect(itemHash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');

                  const expectedHash = jh.calcHash(`{"array":["${itemHash}"]}`);

                  expect(json._hash).toEqual(expectedHash);
                  expect(json._hash).toEqual('zYcZBAUGLgR0ygMxi0V5ZT');
                });
              });
            });
          });

          describe('containing nested arrays', () => {
            it('should hash the nested arrays', () => {
              const json = jh.apply({
                _hash: '',
                array: [['key', 1.0, true], 'hello'],
              });

              const jsonHash = jh.calcHash(
                '{"array":[["key",1,true],"hello"]}',
              );

              expect(json._hash).toEqual(jsonHash);
              expect(json._hash).toEqual('1X_6COC1sP5ECuHvKtVoDT');
            });
          });
        });
      });
    });

    describe('writes the hashes directly into the given json', () => {
      describe('when ApplyConfig.inPlace is true', () => {
        it('writes hashes into original json', () => {
          const json = {
            key: 'value',
            _hash: '',
          };

          const ac = defaultApplyConfig();
          ac.inPlace = true;
          const hashedJson = jh.apply(json, ac);
          expect(hashedJson).toEqual({
            key: 'value',
            _hash: '5Dq88zdSRIOcAS-WM_lYYt',
          });

          expect(json).toEqual(hashedJson);
        });
      });
    });

    describe('writes the hashes into a copy', () => {
      describe('when ApplyConfig.inPlace is false', () => {
        it('does not touch the original object', () => {
          const json = {
            key: 'value',
            _hash: '',
          };
          const ac = defaultApplyConfig();
          ac.inPlace = false;

          // The returned copy has the hashes
          const hashedJson = jh.apply(json, ac);
          expect(hashedJson).toEqual({
            key: 'value',
            _hash: '5Dq88zdSRIOcAS-WM_lYYt',
          });

          // The original json is untouched
          expect(json).toEqual({
            key: 'value',
            _hash: '',
          });
        });
      });
    });

    describe('replaces/updates existing hashes', () => {
      describe('when ApplyConfig.updateExistingHashes is set to true', () => {
        const allHashesChanged = (json: Json) => {
          return (
            json['a']!['_hash'] !== 'hash_a' &&
            json['a']!['b']['_hash'] !== 'hash_b' &&
            json['a']!['b']['c']['_hash'] !== 'hash_c'
          );
        };

        const ac = defaultApplyConfig();
        ac.inPlace = true;
        ac.throwOnWrongHashes = false;

        it('should recalculate existing hashes', () => {
          const json: any = {
            a: {
              _hash: 'hash_a',
              b: {
                _hash: 'hash_b',
                c: {
                  _hash: 'hash_c',
                  d: 'value',
                },
              },
            },
          };

          ac.updateExistingHashes = true;
          jh.apply(json, ac);
          expect(allHashesChanged(json)).toBe(true);
        });
      });
    });

    describe('does not touch existing hashes', () => {
      describe('when ApplyConfig.updateExistingHashes is set to false', () => {
        const noHashesChanged = () => {
          return (
            json.a._hash === 'hash_a' &&
            json.a.b._hash === 'hash_b' &&
            json.a.b.c._hash === 'hash_c'
          );
        };

        const ac = defaultApplyConfig();
        ac.inPlace = true;

        let json: any = {};

        beforeEach(() => {
          json = {
            _hash: '',
            a: {
              _hash: 'hash_a',
              b: {
                _hash: 'hash_b',
                c: {
                  _hash: 'hash_c',
                  d: 'value',
                },
              },
            },
          };
        });

        const changedHashes = () => {
          const result: string[] = [];
          if (json['a']['_hash'] !== 'hash_a') {
            result.push('a');
          }

          if (json['a']['b']['_hash'] !== 'hash_b') {
            result.push('b');
          }

          if (json['a']['b']['c']['_hash'] !== 'hash_c') {
            result.push('c');
          }

          return result;
        };

        it('with all objects having hashes', () => {
          ac.updateExistingHashes = false;
          ac.throwOnWrongHashes = false;
          jh.apply(json, ac);
          expect(noHashesChanged()).toBe(true);
        });

        it('with parents have no hashes', () => {
          delete json['a']['_hash'];
          ac.updateExistingHashes = false;
          ac.throwOnWrongHashes = false;
          jh.apply(json, ac);
          expect(changedHashes()).toEqual(['a']);

          delete json['a']['_hash'];
          delete json['a']['b']['_hash'];
          ac.updateExistingHashes = false;
          jh.apply(json, ac);
          expect(changedHashes()).toEqual(['a', 'b']);
        });
      });
    });

    describe('checks numbers', () => {
      it('.e. throws when NaN is given', () => {
        let message;

        try {
          jh.apply({
            key: NaN,
            _hash: '',
          });
        } catch (e: any) {
          message = e.toString();
        }

        expect(message).toEqual('Error: NaN is not supported.');
      });

      it('i.e. throws when json contains an unsupported type', () => {
        let message;

        try {
          jh.apply({
            _hash: '',
            key: new Error() as unknown as Json,
          });
        } catch (e: any) {
          message = e.toString();
        }

        expect(message).toEqual('Error: Unsupported type: object');
      });

      describe('i.e. ensures numbers have the right precision', () => {
        describe('i.e. it does not throw when numbers have right maximum precision', () => {
          it('e.g. 1.001', () => {
            // Test a json that has a number within the precision -> now throw
            expect(() =>
              jh.apply({
                key: 1.001,
                _hash: '',
              }),
            ).not.toThrow();
          });

          it('e.g. 1.123', () => {
            // Test a json that has a number within the precision -> now throw
            expect(() =>
              jh.apply({
                key: 1.123,
                _hash: '',
              }),
            ).not.toThrow();
          });

          it('e.g. -1.123', () => {
            // Test a json that has a number within the precision -> now throw
            expect(() =>
              jh.apply({
                key: -1.123,
                _hash: '',
              }),
            ).not.toThrow();
          });

          it('e.g. 1e-2', () => {
            // Test a json that has a number within the precision -> now throw
            expect(() =>
              jh.apply({
                key: 1e-2,
                _hash: '',
              }),
            ).not.toThrow();
          });
        });

        describe('i.e. it does throw when numbers do not match maximum precision', () => {
          describe('e.g. numbers have more commas then precision allows', () => {
            it('e.g. 1.0001', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: 1.0001,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number 1.0001 has a higher precision than 0.001.',
              );
            });

            it('e.g. 1.1234', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: 1.1234,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number 1.1234 has a higher precision than 0.001.',
              );
            });

            it('e.g. -1.0001', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: -1.0001,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number -1.0001 has a higher precision than 0.001.',
              );
            });

            it('e.g. -1.1234', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: -1.1234,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number -1.1234 has a higher precision than 0.001.',
              );
            });

            it('e.g. 9839089403.1235', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: 9839089403.1235,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number 9839089403.1235 has a higher precision than 0.001.',
              );
            });

            it('e.g. 9839089403.1235', () => {
              expect(jh.config.numberConfig.precision).toBe(0.001);

              // Test a json that has a number outside the precision -> throw
              let message = '';
              try {
                jh.apply({
                  key: 0.1e-4,
                  _hash: '',
                });
              } catch (e: any) {
                message = e.toString();
              }

              expect(message).toEqual(
                'Error: Number 0.00001 has a higher precision than 0.001.',
              );
            });
          });
        });
      });

      describe('i.e. ensures numbers are in the given range', () => {
        describe('i.e. values exceed NumbersConfig.maxNum', () => {
          let max = 0;

          beforeEach(() => {
            max = jh.config.numberConfig.maxNum;
          });

          function check(val: number) {
            let message = '';
            val = parseFloat(val.toFixed(3));

            try {
              jh.apply({ key: val, _hash: '' });
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toEqual(
              `Error: Number ${val} exceeds NumberHashingConfig.maxNum.`,
            );
          }

          it('.e.g. shortly above the maximum', () => {
            check(max + 0.001);
          });
        });

        describe('i.e. values exceed NumbersConfig.maxNum', () => {
          let min = 0;

          beforeEach(() => {
            min = jh.config.numberConfig.minNum;
          });

          /**
           * val: number
           */
          function check(val: number) {
            let message = '';
            val = parseFloat(val.toFixed(3));

            try {
              jh.apply({ key: val, _hash: '' });
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toEqual(
              `Error: Number ${val} is smaller than NumberHashingConfig.minNum.`,
            );
          }

          it('.e.g. shortly above the maximum', () => {
            check(min - 0.001);
          });
        });
      });
    });

    describe('throws, when existing hashes do not match newly calculated ones', () => {
      describe('when ApplyConfig.throwOnWrongHashes is set to true', () => {
        it('with a simple json', () => {
          const json = {
            key: 'value',
            _hash: 'wrongHash',
          };

          const ac = defaultApplyConfig();
          ac.throwOnWrongHashes = true;

          let message = '';
          try {
            jh.apply(json, ac);
          } catch (e: any) {
            message = e.toString();
          }

          expect(message).toEqual(
            'Error: Hash "wrongHash" does not match the newly calculated one "5Dq88zdSRIOcAS-WM_lYYt". ' +
              'Please make sure that all systems are producing the same hashes.',
          );
        });
      });

      describe('but not when ApplyConfig.throwOnWrongHashes is set to false', () => {
        it('with a simple json', () => {
          const json = {
            key: 'value',
            _hash: 'wrongHash',
          };

          const ac = defaultApplyConfig();
          ac.throwOnWrongHashes = false;
          ac.inPlace = true;

          jh.apply(json, ac);
          expect(json._hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
        });
      });
    });
  });

  describe('applyInPlace()json', () => {
    describe('default', () => {
      it('replaces empty hashes with the correct ones', () => {
        const json = {
          key: 'value',
          _hash: '',
        };

        jh.applyInPlace(json);
        expect(json._hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
      });

      it('throws when existing hashes are wrong', () => {
        const json = {
          key: 'value',
          _hash: 'wrongHash',
        };

        let message = '';
        try {
          jh.applyInPlace(json);
        } catch (e: any) {
          message = e.toString();
        }

        expect(message).toEqual(
          'Error: Hash "wrongHash" is wrong. Should be "5Dq88zdSRIOcAS-WM_lYYt".',
        );
      });

      describe('special cases', () => {
        it('with a simple json', () => {
          jh.applyInPlace({
            name: 'Set width of UE to 1111',
            filter: {
              columnFilters: [
                {
                  type: 'string',
                  column: 'articleType',
                  operator: 'startsWith',
                  search: 'UE',
                  _hash: '',
                },
              ],
              operator: 'and',
              _hash: '',
            },
            actions: [
              {
                column: 'w',
                setValue: 1111,
                _hash: '',
              },
            ],
            _hash: '',
          });
        });
      });
    });

    describe('with updateExistingHashes set to true and throwOnWrongHashes set to false', () => {
      const updateExistingHashes = true;
      const throwOnWrongHashes = true;

      it('overwrites existing hashes', () => {
        const json = {
          key: 'value',
          _hash: 'wrongHash',
        };

        jh.applyInPlace(json, updateExistingHashes, !throwOnWrongHashes);
        expect(json._hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
      });
    });
  });

  describe('calcHash', () => {
    it('with strings', () => {
      const hash = jh.calcHash('{"key":"value"}');
      expect(hash).toEqual('5Dq88zdSRIOcAS-WM_lYYt');
    });

    it('with arrays', () => {
      const array = [1, 2, 'value'];
      const hash = jh.calcHash(array);
      const hash2 = jh.apply({ array: array, _hash: '' })._hash;
      expect(hash).toEqual(hash2);
    });

    it('with maps', () => {
      const map = { key: 'value', _hash: '' };
      const hash = jh.calcHash(map);
      const hash2 = jh.apply(map)._hash;
      expect(hash).toEqual(hash2);
    });
  });

  describe('applyToJsonString(string)', () => {
    it('parses the string, adds the hashes, and returns the serialized string', () => {
      const json = '{"key": "value"}';
      const jsonString = jh.applyToJsonString(json);
      expect(jsonString).toEqual(
        '{"key":"value","_hash":"5Dq88zdSRIOcAS-WM_lYYt"}',
      );
    });
  });

  describe('jsonString(map)', () => {
    const jsonString = Hash.jsonString;

    it('converts a map into a json string', () => {
      expect(jsonString({ a: 1 })).toEqual('{"a":1}');
      expect(jsonString({ a: 'b' })).toEqual('{"a":"b"}');
      expect(jsonString({ a: true })).toEqual('{"a":true}');
      expect(jsonString({ a: false })).toEqual('{"a":false}');
      expect(jsonString({ a: 1.0 })).toEqual('{"a":1}');
      expect(jsonString({ a: 1.0 })).toEqual('{"a":1}');
      expect(
        jsonString({
          a: [1, 2],
        }),
      ).toEqual('{"a":[1,2]}');
      expect(
        jsonString({
          a: { b: 1 },
        }),
      ).toEqual('{"a":{"b":1}}');
    });

    it('throws when unsupported type', () => {
      let message;
      try {
        jsonString({ a: new Error() });
      } catch (e: any) {
        message = e.toString();
      }

      expect(message).toEqual('Error: Unsupported type: object');
    });
  });

  describe('_checkBasicType(string)', () => {
    it('with a string', () => {
      expect(jh.checkBasicType('hello')).toEqual('hello');
    });

    it('with an int', () => {
      expect(jh.checkBasicType(10)).toEqual(10);
    });

    it('with a double', () => {
      expect(jh.checkBasicType(true)).toEqual(true);
    });

    it('with an non basic type', () => {
      let message = '';
      try {
        jh.checkBasicType(new Set());
      } catch (e: any) {
        message = e.toString();
      }

      expect(message).toEqual('Error: Unsupported type: object');
    });
  });

  describe('validate', () => {
    describe('with an empty json', () => {
      describe('throws', () => {
        it('when no hash is given', () => {
          let message: string = '';

          try {
            jh.validate({ _hash: 'fd8089' });
          } catch (e: any) {
            message = e.toString();
          }

          expect(message).toBe(
            'Error: Hash "fd8089" is wrong. Should be "RBNvo1WzZ4oRRq0W9-hknp".',
          );
        });

        it('when hash is wrong', () => {
          let message;

          try {
            jh.validate({
              _hash: 'wrongHash',
            });
          } catch (e: any) {
            message = e.toString();
          }

          expect(message).toBe(
            'Error: Hash "wrongHash" is wrong. Should be "RBNvo1WzZ4oRRq0W9-hknp".',
          );
        });
      });

      describe('does not throw', () => {
        it('when hash is correct', () => {
          expect(() =>
            jh.validate({
              _hash: 'RBNvo1WzZ4oRRq0W9-hknp',
            }),
          ).not.toThrow();
        });

        it('returns the valid object unchanged', () => {
          const json = {
            key: 'value',
            _hash: '5Dq88zdSRIOcAS-WM_lYYt',
          };

          const jsonOut = jh.validate(json);
          expect(jsonOut).toBe(json);
        });
      });
    });

    describe('with a single level json', () => {
      describe('throws', () => {
        it('when no hash is given', () => {
          let message = '';

          try {
            jh.validate({ key: 'value', _hash: 'xyz' });
          } catch (e: any) {
            message = e.toString();
          }

          expect(message).toBe(
            'Error: Hash "xyz" is wrong. Should be "5Dq88zdSRIOcAS-WM_lYYt".',
          );
        });

        it('when hash is wrong', () => {
          let message;

          try {
            jh.validate({
              key: 'value',
              _hash: 'wrongHash',
            });
          } catch (e: any) {
            message = e.toString();
          }

          expect(message).toBe(
            'Error: Hash "wrongHash" is wrong. Should be "5Dq88zdSRIOcAS-WM_lYYt".',
          );
        });
      });

      describe('does not throw', () => {
        it('when hash is correct', () => {
          expect(() =>
            jh.validate({
              key: 'value',
              _hash: '5Dq88zdSRIOcAS-WM_lYYt',
            }),
          ).not.toThrow();
        });
      });
    });

    describe('with a deeply nested json', () => {
      /** @type {Json} */
      let json2;

      beforeEach(() => {
        json2 = {
          _hash: 'oEE88mHZ241BRlAfyG8n9X',
          parent: {
            _hash: '3Wizz29YgTIc1LRaN9fNfK',
            child: {
              key: 'value',
              _hash: '5Dq88zdSRIOcAS-WM_lYYt',
            },
          },
        };
      });

      describe('throws', () => {
        describe('when no hash is given', () => {
          it('at the root', () => {
            let message;
            delete json2['_hash'];

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe('Error: Hash is missing.');
          });

          it('at the parent', () => {
            let message;
            delete json2['parent']['_hash'];

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe('Error: Hash at /parent is missing.');
          });

          it('at the child', () => {
            let message;
            delete json2['parent']['child']['_hash'];

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe('Error: Hash at /parent/child is missing.');
          });
        });

        describe('when hash is wrong', () => {
          it('at the root', () => {
            let message;
            json2['_hash'] = 'wrongHash';

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash "wrongHash" is wrong. Should be "oEE88mHZ241BRlAfyG8n9X".',
            );
          });

          it('at the parent', () => {
            let message;
            json2['parent']['_hash'] = 'wrongHash';

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash at /parent "wrongHash" is wrong. Should be "3Wizz29YgTIc1LRaN9fNfK".',
            );
          });

          it('at the child', () => {
            let message;
            json2['parent']['child']['_hash'] = 'wrongHash';

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash at /parent/child "wrongHash" is wrong. Should be "5Dq88zdSRIOcAS-WM_lYYt".',
            );
          });
        });

        describe('not', () => {
          it('when hash is correct', () => {
            expect(() => jh.validate(json2)).not.toThrow();
          });
        });
      });
    });

    describe('with a deeply nested json with child array', () => {
      /** @type {Json} */
      let json2;

      beforeEach(() => {
        json2 = {
          _hash: 'IoJ_C8gm8uVu8ExpS7ZNPY',
          parent: [
            {
              _hash: 'kDsVfUjnkXU7_KXqp-PuyA',
              child: [{ key: 'value', _hash: '5Dq88zdSRIOcAS-WM_lYYt' }],
            },
          ],
        };
      });

      describe('throws', () => {
        describe('when no hash is given', () => {
          it('at the parent', () => {
            let message;
            delete json2['parent'][0]['_hash'];

            try {
              jh.validate(json2);
            } catch (e: any) {
              message = e.toString();
            }

            expect(message).toBe('Error: Hash at /parent/0 is missing.');
          });

          it('at the child', () => {
            let message;
            delete json2['parent'][0]['child'][0]['_hash'];

            try {
              jh.validate(json2);
            } catch (/** @type any */ e) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash at /parent/0/child/0 is missing.',
            );
          });
        });

        describe('when hash is wrong', () => {
          it('at the parent', () => {
            let message;
            json2['parent'][0]['_hash'] = 'wrongHash';

            try {
              jh.validate(json2);
            } catch (/** @type any */ e) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash at /parent/0 "wrongHash" is wrong. Should be "kDsVfUjnkXU7_KXqp-PuyA".',
            );
          });

          it('at the child', () => {
            let message;
            json2['parent'][0]['child'][0]['_hash'] = 'wrongHash';

            try {
              jh.validate(json2);
            } catch (/** @type any */ e) {
              message = e.toString();
            }

            expect(message).toBe(
              'Error: Hash at /parent/0/child/0 "wrongHash" is wrong. Should be "5Dq88zdSRIOcAS-WM_lYYt".',
            );
          });
        });

        describe('not', () => {
          it('when hash is correct', () => {
            expect(() => jh.validate(json2)).not.toThrow();
          });
        });
      });
    });

    describe('special cases', () => {
      it('dictionaries with numbers as key', async () => {
        const json = {
          '1270537611': 'mxK7Q1zeVB1httPrYsn0ow',
          '522965': 'PAue6PJ83JBmIqoElcDmot',
          _hash: '',
        };

        jh.apply(json, {
          inPlace: true,
          updateExistingHashes: true,
          throwOnWrongHashes: false,
        });

        expect(json['_hash']).toBe('W4CAuZT_tIicr6crbn6LA8');
      });
    });
  });

  describe('hip', () => {
    it('writes hashes in place and returns the json', () => {
      const x = { a: { b: 1 } };
      const xHashed = hip(x);
      expect(x).toBe(xHashed);
      expect(xHashed._hash).toBe('aGyCrR_fCrzMa6oP_6N50z');
      expect(xHashed.a._hash).toBe('647TzLUCMJO1b0kKRlAeiN');
    });
  });

  describe('hsh', () => {
    it('remains the original object unchanged and returns a copy with hashes', () => {
      const x = { a: { b: 1 } };
      const xHashed = hsh(x);
      expect(x).toEqual({ a: { b: 1 } });
      expect(xHashed._hash).toBe('aGyCrR_fCrzMa6oP_6N50z');
      expect(xHashed.a._hash).toBe('647TzLUCMJO1b0kKRlAeiN');
    });
  });
});

const exampleJson = `{
  "layerA": {
    "data": [
      {
        "w": 600,
        "w1": 100
      },
      {
        "w": 700,
        "w1": 100
      }
    ]
  },

  "layerB": {
    "data": [
      {
        "d": 268,
        "d1": 100
      }
    ]
  },

  "layerC": {
    "data": [
      {
        "h": 800
      }
    ]
  },

  "layerD": {
    "data": [
      {
        "wMin": 0,
        "wMax": 900,
        "w1Min": 0,
        "w1Max": 900
      }
    ]
  },

  "layerE": {
    "data": [
      {
        "type": "XYZABC",
        "widths": "sLZpHAffgchgJnA++HqKtO",
        "depths": "k1IL2ctZHw4NpaA34w0d0I",
        "heights": "GBLHz0ayRkVUlms1wHDaJq",
        "ranges": "9rohAG49drWZs9tew4rDef"
      }
    ]
  },

  "layerF": {
    "data": [
      {
        "type": "XYZABC",
        "name": "Unterschrank 60cm"
      }
    ]
  },

  "layerG": {
    "data": [
      {
        "type": "XYZABC",
        "name": "Base Cabinet 23.5"
      }
    ]
  }
}`;

const exampleJsonWithHashes = `{
  "layerA": {
    "data": [
      {
        "w": 600,
        "w1": 100,
        "_hash": "ajRQhCx6QLPI8227B72r8I"
      },
      {
        "w": 700,
        "w1": 100,
        "_hash": "Jf177UAntzI4rIjKiU_MVt"
      }
    ],
    "_hash": "qCgcNNF3wJPfx0rkRDfoSY"
  },
  "layerB": {
    "data": [
      {
        "d": 268,
        "d1": 100,
        "_hash": "9mJ7aZJexhfz8IfwF6bsuW"
      }
    ],
    "_hash": "tb0ffNF2ePpqsRxmvMDRrt"
  },
  "layerC": {
    "data": [
      {
        "h": 800,
        "_hash": "KvMHhk1dYYQ2o5Srt6pTUN"
      }
    ],
    "_hash": "Z4km_FzQoxyck-YHQDZMtV"
  },
  "layerD": {
    "data": [
      {
        "wMin": 0,
        "wMax": 900,
        "w1Min": 0,
        "w1Max": 900,
        "_hash": "6uw0BSIllrk6DuKyvQh-Rg"
      }
    ],
    "_hash": "qFDAzWUsTnqICnpc_rJtax"
  },
  "layerE": {
    "data": [
      {
        "type": "XYZABC",
        "widths": "sLZpHAffgchgJnA++HqKtO",
        "depths": "k1IL2ctZHw4NpaA34w0d0I",
        "heights": "GBLHz0ayRkVUlms1wHDaJq",
        "ranges": "9rohAG49drWZs9tew4rDef",
        "_hash": "65LigWuYVGgifKnEZaOJET"
      }
    ],
    "_hash": "pDRglh2oWJcghTzzrzTLw6"
  },
  "layerF": {
    "data": [
      {
        "type": "XYZABC",
        "name": "Unterschrank 60cm",
        "_hash": "gjzETUIUf563ZJNHVEY9Wt"
      }
    ],
    "_hash": "r1u6gR8WLzPAZ3lEsAqREP"
  },
  "layerG": {
    "data": [
      {
        "type": "XYZABC",
        "name": "Base Cabinet 23.5",
        "_hash": "DEyuShUHDpWSJ7Rq_a3uz6"
      }
    ],
    "_hash": "3meyGs7XhOh8gWFNQFYZDI"
  },
  "_hash": "OmmdaqCAhcIKnDm7lT-_gI"
}`;
