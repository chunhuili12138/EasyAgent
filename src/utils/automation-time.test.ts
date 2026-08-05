import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAutomationTime, parseAutomationTime } from './automation-time';

test('treats offset-free automation timestamps as UTC', () => {
  assert.equal(parseAutomationTime('2026-08-05 09:00:00').toISOString(), '2026-08-05T09:00:00.000Z');
  assert.equal(parseAutomationTime('2026-08-05T09:00:00').toISOString(), '2026-08-05T09:00:00.000Z');
});

test('preserves explicit timezone offsets', () => {
  assert.equal(parseAutomationTime('2026-08-05T17:00:00+08:00').toISOString(), '2026-08-05T09:00:00.000Z');
  assert.equal(parseAutomationTime('2026-08-05T09:00:00Z').toISOString(), '2026-08-05T09:00:00.000Z');
});

test('keeps empty and invalid values readable', () => {
  assert.equal(formatAutomationTime(), '-');
  assert.equal(formatAutomationTime('not-a-date'), 'not-a-date');
});
