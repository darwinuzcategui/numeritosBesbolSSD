import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basesTotal, battingAverage, slugging, inningsOuts, pclEra, outsToInnings } from './calc.js';

test('bases totales', () => {
  assert.equal(basesTotal(16, 0, 0, 1), 19); // 15 sencillos + 1 HR = 15 + 4 = 19
  assert.equal(basesTotal(1, 1, 0, 0), 2);   // 1 doble = 2
  assert.equal(basesTotal(1, 0, 1, 0), 3);   // 1 triple = 3
  assert.equal(basesTotal(0, 0, 0, 0), 0);
});

test('AV y SLG (caso Fase 1: VB=51, H=16, HR=1)', () => {
  const vb = 51, h = 16;
  const bases = basesTotal(h, 0, 0, 1);
  assert.equal(bases, 19);
  assert.equal(battingAverage(h, vb).toFixed(3), '0.314');
  assert.equal(slugging(bases, vb).toFixed(3), '0.373');
});

test('AV y SLG con VB=0 dan 0', () => {
  assert.equal(battingAverage(0, 0), 0);
  assert.equal(slugging(0, 0), 0);
});

test('PCL/ERA (caso Fase 1: CL=7, 18 IP -> 3.5)', () => {
  const outs = 18 * 3;
  assert.equal(pclEra(7, outs).toFixed(2), '3.50');
});

test('PCL/ERA sin entradas da 0', () => {
  assert.equal(pclEra(5, 0), 0);
});

test('inningsOuts en tercios', () => {
  assert.equal(inningsOuts(3.0), 9);
  assert.equal(inningsOuts(3.1), 10);
  assert.equal(inningsOuts(3.2), 11);
});

test('outsToInnings', () => {
  assert.equal(outsToInnings(18), 6.0);
  assert.equal(outsToInnings(10), 3.1);
  assert.equal(outsToInnings(11), 3.2);
});
