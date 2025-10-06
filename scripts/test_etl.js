#!/usr/bin/env node
/**
 * Smoke tests for ETL helpers
 */

import assert from 'node:assert/strict';
import { normalizeOptions } from './processPdfWithOcr.js';

function testNormalizeOptionsArray() {
  const input = ['A) Uno', 'B) Dos', 'C) Tres'];
  const result = normalizeOptions(input);
  assert.equal(result.a, 'Uno');
  assert.equal(result.b, 'Dos');
  assert.equal(result.c, 'Tres');
}

function testNormalizeOptionsObject() {
  const input = { a: 'Alpha', b: 'Beta' };
  const result = normalizeOptions(input);
  assert.deepEqual(result, input);
}

function run() {
  testNormalizeOptionsArray();
  testNormalizeOptionsObject();
  console.log('✅ ETL smoke tests passed');
}

run();
