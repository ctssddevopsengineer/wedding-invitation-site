export function normalizePhone(phone) {
  if (typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function buildTelHref(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : '';
}

export function isConfiguredContact(contact) {
  return Boolean(
    contact &&
    typeof contact.name === 'string' &&
    contact.name.trim() &&
    normalizePhone(contact.phone).replace('+', '').length >= 10
  );
}
