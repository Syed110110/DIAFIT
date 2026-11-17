const test = require('node:test');
const assert = require('node:assert/strict');
const { auditActionForMethod, isApiRequest } = require('../dist/domain/auditPolicy');

test('audit policy distinguishes API reads, writes, and non-mutating unsupported methods', () => {
  assert.equal(auditActionForMethod('GET'), 'READ');
  assert.equal(auditActionForMethod('POST'), 'WRITE');
  assert.equal(auditActionForMethod('DELETE'), 'WRITE');
  assert.equal(auditActionForMethod('OPTIONS'), null);
  assert.equal(isApiRequest('/api/care/doses'), true);
  assert.equal(isApiRequest('/dashboard'), false);
});