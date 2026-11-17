const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessPatient } = require('../dist/security/accessPolicy');

test('patients can access only their own patient record', () => {
  assert.equal(canAccessPatient('PATIENT', 'patient1', 'patient1', false), true);
  assert.equal(canAccessPatient('PATIENT', 'patient1', 'patient2', true), false);
});

test('care-team roles require an approved patient membership', () => {
  for (const role of ['CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR']) {
    assert.equal(canAccessPatient(role, 'member1', 'patient1', true), true);
    assert.equal(canAccessPatient(role, 'member1', 'patient1', false), false);
  }
});

test('admins are denied patient records even if a membership exists', () => {
  assert.equal(canAccessPatient('ADMIN', 'admin1', 'patient1', true), false);
});