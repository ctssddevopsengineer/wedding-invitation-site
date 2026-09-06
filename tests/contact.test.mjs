import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTelHref, isConfiguredContact, normalizePhone } from '../lib/contact.mjs';

test('normalizes Indian phone numbers', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
});

test('builds tel href', () => {
  assert.equal(buildTelHref('+91 98765 43210'), 'tel:+919876543210');
});

test('configured contact requires a usable phone number', () => {
  assert.equal(isConfiguredContact({ name: 'Amit', phone: '+91 98765 43210' }), true);
  assert.equal(isConfiguredContact({ name: 'Contact Name', phone: '+91 XXXXX XXXXX' }), false);
});
