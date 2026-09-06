import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildInvitationAbsoluteUrl,
  buildInvitationRelativeUrl,
  deepLinkFromPageIndex,
  getDeepLinkState,
  getInitialDeepLinkState,
  pageIndexFromDeepLink,
  resolvePageDeepLink
} from '../lib/deep-link.mjs';
import { buildNfcWriteMessage, buildQrImageUrl, supportsWebNfc } from '../lib/invitation-entry.mjs';

const book = fs.readFileSync(new URL('../components/InvitationBook.js', import.meta.url), 'utf8');
const share = fs.readFileSync(new URL('../components/SmartSharePanel.js', import.meta.url), 'utf8');
const qrNfc = fs.readFileSync(new URL('../components/QrNfcPanel.js', import.meta.url), 'utf8');
const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../app/phase2b.css', import.meta.url), 'utf8');

test('deep links map invitation sections to stable page indexes', () => {
  assert.equal(resolvePageDeepLink('front'), 'front');
  assert.equal(resolvePageDeepLink('inside-left'), 'family');
  assert.equal(resolvePageDeepLink('reception'), 'details');
  assert.equal(resolvePageDeepLink('map'), 'location');
  assert.equal(resolvePageDeepLink('unknown'), 'front');
  assert.equal(pageIndexFromDeepLink('family'), 1);
  assert.equal(pageIndexFromDeepLink('location'), 2);
  assert.equal(deepLinkFromPageIndex(3), 'back');
});

test('location deep links open page three and request the map panel', () => {
  assert.deepEqual(getDeepLinkState('?theme=navy&page=location'), {
    pageLink: 'location',
    pageIndex: 2,
    locationOpen: true
  });
});

test('initial navigation keeps explicit deep links, while browser reload always starts from Front', () => {
  assert.deepEqual(getInitialDeepLinkState('?theme=plum&page=details', 'navigate'), {
    pageLink: 'details',
    pageIndex: 2,
    locationOpen: false
  });
  assert.deepEqual(getInitialDeepLinkState('?theme=plum&page=location', 'navigate'), {
    pageLink: 'location',
    pageIndex: 2,
    locationOpen: true
  });
  assert.deepEqual(getInitialDeepLinkState('?theme=plum&page=back', 'reload'), {
    pageLink: 'front',
    pageIndex: 0,
    locationOpen: false
  });
  assert.deepEqual(getInitialDeepLinkState('?theme=navy&page=location', 'reload'), {
    pageLink: 'front',
    pageIndex: 0,
    locationOpen: false
  });
});

test('share URLs preserve unrelated query parameters while updating theme and page', () => {
  const relative = buildInvitationRelativeUrl(
    { pathname: '/invite', search: '?guest=family&theme=classic&page=front', hash: '#card' },
    { themeId: 'plum', pageIndex: 2 }
  );
  assert.equal(relative, '/invite?guest=family&theme=plum&page=details#card');

  const absolute = buildInvitationAbsoluteUrl(
    { origin: 'https://invite.example', pathname: '/', search: '', hash: '' },
    { themeId: 'saffron', pageLink: 'location' }
  );
  assert.equal(absolute, 'https://invite.example/?theme=saffron&page=location');
});

test('QR helper encodes the invitation URL and clamps image size', () => {
  const qr = buildQrImageUrl('https://invite.example/?theme=navy&page=front', 9999);
  assert.match(qr, /^https:\/\/api\.qrserver\.com\/v1\/create-qr-code\//);
  assert.match(qr, /size=512x512/);
  assert.match(qr, /data=https%3A%2F%2Finvite\.example/);
});

test('NFC helper creates one URL NDEF record and feature detection is progressive', () => {
  assert.deepEqual(buildNfcWriteMessage('https://invite.example/'), {
    records: [{ recordType: 'url', data: 'https://invite.example/' }]
  });
  assert.equal(supportsWebNfc({}), false);
  assert.equal(supportsWebNfc({ NDEFReader: class {} }), true);
});

test('InvitationBook resets only reload entry to Front and preserves history/deep-link behavior', () => {
  assert.match(book, /getInitialDeepLinkState\(window\.location\.search, navigationType\)/);
  assert.match(book, /getEntriesByType\?\.\('navigation'\)/);
  assert.match(book, /navigationEntry\?\.type \?\? 'navigate'/);
  assert.match(book, /const deepLink = getDeepLinkState\(window\.location\.search\);/);
  assert.match(book, /buildInvitationRelativeUrl/);
  assert.match(book, /locationDeepLinked/);
  assert.match(book, /<SmartSharePanel/);
  assert.match(book, /<QrNfcPanel/);
});

test('smart share prefers Web Share API and falls back to copying the deep link', () => {
  assert.match(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard\?\.writeText/);
  assert.match(share, /buildInvitationAbsoluteUrl/);
  assert.match(share, /EVENT\.title/);
});

test('location popover accepts deep-link open state without removing touch/keyboard controls', () => {
  assert.match(insideRight, /initialLocationOpen/);
  assert.match(insideRight, /onLocationOpenChange/);
  assert.match(insideRight, /onClick=\{togglePinnedLocation\}/);
  assert.match(insideRight, /event\.key === 'Escape'/);
});

test('QR and NFC UI keeps physical-tag entry on the front cover and gates Web NFC writes', () => {
  assert.match(qrNfc, /pageIndex:\s*0/);
  assert.match(qrNfc, /supportsWebNfc\(window\)/);
  assert.match(qrNfc, /new window\.NDEFReader\(\)/);
  assert.match(qrNfc, /Write NFC tag/);
  assert.match(qrNfc, /<details className="qrNfcPanel">/);
});

test('Phase 2B controls include responsive and focus-visible styling', () => {
  assert.match(css, /\.phase2bExperienceTools/);
  assert.match(css, /\.experienceButton:focus-visible/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
