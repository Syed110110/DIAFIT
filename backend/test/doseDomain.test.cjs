const test = require('node:test');
const assert = require('node:assert/strict');
const { markDoseMissed, stateForDoseLog } = require('../dist/domain/doseStateMachine');
const { isConflictingDoseLog } = require('../dist/domain/conflictPolicy');

const scheduledFor = new Date('2026-10-05T08:00:00.000Z');

test('dose logs are taken within the configured grace period and late after it', () => {
  assert.equal(stateForDoseLog('PENDING', scheduledFor, new Date('2026-10-05T08:10:00Z'), 15), 'TAKEN');
  assert.equal(stateForDoseLog('PENDING', scheduledFor, new Date('2026-10-05T08:16:00Z'), 15), 'LATE');
});

test('pending doses become missed only after the configured miss window', () => {
  assert.equal(markDoseMissed('PENDING', scheduledFor, new Date('2026-10-05T09:59:00Z'), 120), 'PENDING');
  assert.equal(markDoseMissed('PENDING', scheduledFor, new Date('2026-10-05T10:00:00Z'), 120), 'MISSED');
  assert.equal(markDoseMissed('TAKEN', scheduledFor, new Date('2026-10-05T10:00:00Z'), 120), 'TAKEN');
});

test('logging a previously missed dose adds a late record without changing prior history', () => {
  assert.equal(stateForDoseLog('MISSED', scheduledFor, new Date('2026-10-05T10:30:00Z'), 15), 'LATE');
});

test('different roles logging the same dose inside the configured window conflict', () => {
  assert.equal(isConflictingDoseLog('PATIENT', scheduledFor, 'CAREGIVER', new Date(scheduledFor.getTime() + 60_000), 300), true);
  assert.equal(isConflictingDoseLog('PATIENT', scheduledFor, 'CAREGIVER', new Date(scheduledFor.getTime() + 301_000), 300), false);
  assert.equal(isConflictingDoseLog('CAREGIVER', scheduledFor, 'CAREGIVER', scheduledFor, 300), false);
});