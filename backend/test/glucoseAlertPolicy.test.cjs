const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyGlucoseReading, shouldEscalateAlert } = require('../dist/domain/glucoseAlertPolicy');

test('glucose classification stays disabled until clinician-configured safe bounds exist', () => {
  assert.equal(classifyGlucoseReading(500, { safeMin: null, safeMax: null }), null);
});

test('configured safe range returns no alert inside and warning outside', () => {
  const bounds = { safeMin: 80, safeMax: 180 };
  assert.equal(classifyGlucoseReading(120, bounds), null);
  assert.equal(classifyGlucoseReading(70, bounds), 'WARNING');
  assert.equal(classifyGlucoseReading(190, bounds), 'WARNING');
});

test('critical alerts require separately configured critical bounds', () => {
  const bounds = { safeMin: 80, safeMax: 180, criticalMin: 55, criticalMax: 300 };
  assert.equal(classifyGlucoseReading(50, bounds), 'CRITICAL');
  assert.equal(classifyGlucoseReading(310, bounds), 'CRITICAL');
  assert.equal(classifyGlucoseReading(70, bounds), 'WARNING');
});

test('SOS escalates immediately and ordinary alerts wait for acknowledgement deadline', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  assert.equal(shouldEscalateAlert({ kind: 'SOS', state: 'OPEN', ackDueAt: new Date(now.getTime() + 60_000), now }), true);
  assert.equal(shouldEscalateAlert({ kind: 'MISSED_DOSE', state: 'OPEN', ackDueAt: new Date(now.getTime() + 60_000), now }), false);
  assert.equal(shouldEscalateAlert({ kind: 'MISSED_DOSE', state: 'OPEN', ackDueAt: now, now }), true);
  assert.equal(shouldEscalateAlert({ kind: 'MISSED_DOSE', state: 'ACKNOWLEDGED', ackDueAt: now, now }), false);
});