import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

const EXPECTED = Object.freeze({
  'public/themes/blush/back-monogram.png': 'a118687a1e921c3ccffe2ae3e0d70cce094e5bf899ba7a9cc6a45244d737bbba',
  'public/themes/blush/back.png': '12590c44a8dc36a32380644bb0fc4d3e6479a80e565139caccd4dc8e6b3e3730',
  'public/themes/blush/front.png': 'd9e356ded11eb782fcb8421bc38e92ea6cc9c1d9265128532afaafc9c1831876',
  'public/themes/blush/inside-left-monogram.png': 'a118687a1e921c3ccffe2ae3e0d70cce094e5bf899ba7a9cc6a45244d737bbba',
  'public/themes/blush/inside-left.png': 'e4ad854981eb1875980a453735a8d3761b507af76dedb9f1740a0c249b838729',
  'public/themes/blush/inside-right-monogram.png': 'a118687a1e921c3ccffe2ae3e0d70cce094e5bf899ba7a9cc6a45244d737bbba',
  'public/themes/blush/inside-right.png': 'c7361695fee5fc030af3858b6f05fcffdc7d42c737130f93d24b5ec717c94cdc',
  'public/themes/classic/back-monogram.png': 'c8ffae1963cda2b3c8d9d9b8856cd51d428d7476b1c97cc94f38048e75285a01',
  'public/themes/classic/back.png': 'a425ef8c7a703fc80bef27f12e3695ad538749542e5353e3836e481a02c594cc',
  'public/themes/classic/front.png': 'b6d467af2dbedcaa35a6da864b9e5854ee77ff1dd1b5306ac9192eb0772731b6',
  'public/themes/classic/inside-left-monogram.png': '3c189190caefcf2340ec6631fa1d9da34f2e31462b4c5b618b4c1d3b4833ada1',
  'public/themes/classic/inside-left.png': '0aa4ad45da44a956353b9d5bf580645b6459294344be19270ec86cf44a30fe86',
  'public/themes/classic/inside-right.png': 'fe87ff510dc81aa233f0c5b08975ac0fae7f2ce27cdd06cc583bd26611a0684c',
  'public/themes/magenta/back-monogram.png': '34c0494686ff47f90ed3c93c2e565549a94da28f4ae4a48ace365b590f597d28',
  'public/themes/magenta/back.png': 'b7f3800f6a9ffe6bba92a657209e47d123ed418867e66dc59971e816b4e09adc',
  'public/themes/magenta/front.png': '91a16cd9709aae8862e79d30478961a73d6b2f44821e2154d22b6b8a0a0d4c32',
  'public/themes/magenta/inside-left-monogram.png': '34c0494686ff47f90ed3c93c2e565549a94da28f4ae4a48ace365b590f597d28',
  'public/themes/magenta/inside-left.png': 'c821303366e4f2b9e9d8fed1d0df02b7862e8c0680412ef070c171cf12663806',
  'public/themes/magenta/inside-right-monogram.png': '34c0494686ff47f90ed3c93c2e565549a94da28f4ae4a48ace365b590f597d28',
  'public/themes/magenta/inside-right.png': 'f026f63ba170de3a29d0e4371e267b9f76ff15a098343b8c62be22cd807a6ef2',
});

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }

test('adding Royal Navy does not alter any approved Classic, Blush or Rani Magenta asset bytes', () => {
  for (const [file, expected] of Object.entries(EXPECTED)) {
    assert.equal(sha256(file), expected, `${file} changed`);
  }
});
