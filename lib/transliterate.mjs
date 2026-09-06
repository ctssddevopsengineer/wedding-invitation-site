const SCRIPT = Object.freeze({
  bn: Object.freeze({
    vowels: Object.freeze({ a: 'অ', aa: 'আ', i: 'ই', ee: 'ঈ', ii: 'ঈ', u: 'উ', oo: 'ঊ', uu: 'ঊ', e: 'এ', ai: 'আই', o: 'ও', au: 'আউ' }),
    vowelMarks: Object.freeze({ a: '', aa: 'া', i: 'ি', ee: 'ী', ii: 'ী', u: 'ু', oo: 'ূ', uu: 'ূ', e: 'ে', ai: 'াই', o: 'ো', au: 'াউ' }),
    consonants: Object.freeze({
      ksh: 'ক্ষ', kh: 'খ', gh: 'ঘ', ch: 'চ', chh: 'ছ', jh: 'ঝ', th: 'থ', dh: 'ধ', ph: 'ফ', bh: 'ভ', sh: 'শ', ng: 'ং', ny: 'ঞ',
      k: 'ক', g: 'গ', c: 'ক', j: 'জ', t: 'ত', d: 'দ', n: 'ন', p: 'প', b: 'ব', m: 'ম', y: 'য', r: 'র', l: 'ল', v: 'ভ', w: 'ও', s: 'স', h: 'হ', f: 'ফ', z: 'জ', q: 'ক', x: 'ক্স'
    }),
    virama: '্', digits: '০১২৩৪৫৬৭৮৯'
  }),
  ne: Object.freeze({
    vowels: Object.freeze({ a: 'अ', aa: 'आ', i: 'इ', ee: 'ई', ii: 'ई', u: 'उ', oo: 'ऊ', uu: 'ऊ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' }),
    vowelMarks: Object.freeze({ a: '', aa: 'ा', i: 'ि', ee: 'ी', ii: 'ी', u: 'ु', oo: 'ू', uu: 'ू', e: 'े', ai: 'ै', o: 'ो', au: 'ौ' }),
    consonants: Object.freeze({
      ksh: 'क्ष', kh: 'ख', gh: 'घ', ch: 'च', chh: 'छ', jh: 'झ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ', sh: 'श', ng: 'ङ', ny: 'ञ',
      k: 'क', g: 'ग', c: 'क', j: 'ज', t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', h: 'ह', f: 'फ', z: 'ज', q: 'क', x: 'क्स'
    }),
    virama: '्', digits: '०१२३४५६७৮৯'
  })
});

const WORD_OVERRIDES = Object.freeze({
  bn: Object.freeze({
    soukarya: 'সৌকর্য', diksha: 'দীক্ষা', road: 'রোড', street: 'স্ট্রিট', lane: 'লেন', avenue: 'অ্যাভিনিউ',
    kolkata: 'কলকাতা', bengal: 'বেঙ্গল', west: 'ওয়েস্ট', india: 'ইন্ডিয়া', hall: 'হল', banquet: 'ব্যাঙ্কোয়েট',
    palace: 'প্যালেস', garden: 'গার্ডেন', club: 'ক্লাব', house: 'হাউস', bhawan: 'ভবন', bhavan: 'ভবন'
  }),
  ne: Object.freeze({
    soukarya: 'सौकार्य', diksha: 'दीक्षा', road: 'रोड', street: 'स्ट्रिट', lane: 'लेन', avenue: 'एभिन्यू',
    kolkata: 'कोलकाता', bengal: 'बङ्गाल', west: 'वेस्ट', india: 'इन्डिया', hall: 'हल', banquet: 'बैंक्वेट',
    palace: 'प्यालेस', garden: 'गार्डेन', club: 'क्लब', house: 'हाउस', bhawan: 'भवन', bhavan: 'भवन'
  })
});

const VOWEL_TOKENS = ['aa', 'ee', 'ii', 'oo', 'uu', 'ai', 'au', 'a', 'i', 'u', 'e', 'o'];
const CONSONANT_TOKENS = ['ksh', 'chh', 'kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh', 'sh', 'ng', 'ny', 'k', 'g', 'c', 'j', 't', 'd', 'n', 'p', 'b', 'm', 'y', 'r', 'l', 'v', 'w', 's', 'h', 'f', 'z', 'q', 'x'];

function startsWithAny(text, index, tokens) {
  return tokens.find((token) => text.startsWith(token, index));
}

function transliterateWord(word, language) {
  const cfg = SCRIPT[language];
  if (!cfg) return word;
  const lower = word.toLowerCase();
  const override = WORD_OVERRIDES[language]?.[lower];
  if (override) return override;

  let out = '';
  let i = 0;
  while (i < lower.length) {
    const char = lower[i];
    if (/[0-9]/.test(char)) {
      out += cfg.digits[Number(char)];
      i += 1;
      continue;
    }

    const vowel = startsWithAny(lower, i, VOWEL_TOKENS);
    if (vowel) {
      out += cfg.vowels[vowel];
      i += vowel.length;
      continue;
    }

    const consonant = startsWithAny(lower, i, CONSONANT_TOKENS);
    if (consonant) {
      const consText = cfg.consonants[consonant];
      i += consonant.length;
      const nextVowel = startsWithAny(lower, i, VOWEL_TOKENS);
      if (nextVowel) {
        out += consText + cfg.vowelMarks[nextVowel];
        i += nextVowel.length;
      } else {
        const hasFollowingConsonant = Boolean(startsWithAny(lower, i, CONSONANT_TOKENS));
        out += consText + (hasFollowingConsonant ? cfg.virama : '');
      }
      continue;
    }

    out += word[i];
    i += 1;
  }
  return out;
}

export function transliterate(value, language) {
  if (language !== 'bn' && language !== 'ne') return String(value ?? '');
  const text = String(value ?? '');
  if (!/[A-Za-z]/.test(text)) return text;
  return text.replace(/[A-Za-z0-9]+/g, (word) => transliterateWord(word, language));
}
