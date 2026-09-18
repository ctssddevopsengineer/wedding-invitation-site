const DEVANAGARI_ZWJ = '\u200D';

/**
 * Preserve the configured Nepali text while giving browsers an explicit
 * shaping hint for the rare र् + झ conjunct used in "निर्झरा".
 *
 * The semantic/source value stays unchanged; only the rendered string gets
 * a zero-width joiner after the virama so browsers do not collapse the
 * conjunct into a misleading glyph form.
 */
export function shapeNepaliDisplayText(value) {
  const text = String(value ?? '');
  return text.replace(/र्(?=झ)/gu, `र्${DEVANAGARI_ZWJ}`);
}
