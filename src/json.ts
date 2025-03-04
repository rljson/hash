// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

export interface Json {
  [key: string]: JsonValue;
  _hash: string;
}

export type JsonValue = string | number | boolean | null | Json | JsonArray;

export type JsonArray = Array<JsonValue>;
