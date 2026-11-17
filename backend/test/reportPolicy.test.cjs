const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canViewClinicalReport,
  calculateAdherenceMetrics,
  categorizeGlucoseLevel,
} = require('../dist/domain/reportPolicy');

test('authorized roles (Doctor, Coordinator, Caregiver) with approved membership can view patient report', () => {
  assert.equal(canViewClinicalReport('DOCTOR', 'doc1', 'pat1', true), true);
  assert.equal(canViewClinicalReport('FAMILY_COORDINATOR', 'coord1', 'pat1', true), true);
  assert.equal(canViewClinicalReport('CAREGIVER', 'cg1', 'pat1', true), true);
});

test('patient can view their own clinical report', () => {
  assert.equal(canViewClinicalReport('PATIENT', 'pat1', 'pat1', false), true);
});

test('negative test: admin is strictly denied clinical reports', () => {
  assert.equal(canViewClinicalReport('ADMIN', 'admin1', 'pat1', true), false);
  assert.equal(canViewClinicalReport('ADMIN', 'admin1', 'pat1', false), false);
});

test('negative test: care-team member without approved patient membership is denied', () => {
  assert.equal(canViewClinicalReport('DOCTOR', 'doc1', 'pat1', false), false);
  assert.equal(canViewClinicalReport('FAMILY_COORDINATOR', 'coord1', 'pat1', false), false);
  assert.equal(canViewClinicalReport('CAREGIVER', 'cg1', 'pat1', false), false);
});

test('negative test: patient cannot view another patient report', () => {
  assert.equal(canViewClinicalReport('PATIENT', 'pat1', 'pat2', false), false);
  assert.equal(canViewClinicalReport('PATIENT', 'pat1', 'pat2', true), false);
});

test('calculates adherence rate and status correctly', () => {
  const metrics = calculateAdherenceMetrics({ taken: 18, late: 2, missed: 5, pending: 2 });
  assert.equal(metrics.totalScheduled, 27);
  assert.equal(metrics.totalEvaluated, 25);
  assert.equal(metrics.adherenceRate, 80); // (18 + 2) / 25 = 80%
  assert.equal(metrics.onTimeRate, 72);   // 18 / 25 = 72%
  assert.equal(metrics.adherenceStatus, 'GOOD');

  const poorMetrics = calculateAdherenceMetrics({ taken: 5, late: 1, missed: 10, pending: 0 });
  assert.equal(poorMetrics.adherenceRate, 38);
  assert.equal(poorMetrics.adherenceStatus, 'AT_RISK');
});

test('categorizes blood glucose readings into low, normal, and high', () => {
  assert.equal(categorizeGlucoseLevel(65, 70, 180), 'LOW');
  assert.equal(categorizeGlucoseLevel(110, 70, 180), 'NORMAL');
  assert.equal(categorizeGlucoseLevel(210, 70, 180), 'HIGH');

  // Custom clinician safe range (80-140)
  assert.equal(categorizeGlucoseLevel(75, 80, 140), 'LOW');
  assert.equal(categorizeGlucoseLevel(130, 80, 140), 'NORMAL');
  assert.equal(categorizeGlucoseLevel(155, 80, 140), 'HIGH');
});
