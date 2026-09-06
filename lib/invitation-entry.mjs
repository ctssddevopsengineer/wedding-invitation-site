export const INVITATION_QR_SIZE = 240;
export const QR_IMAGE_ENDPOINT = 'https://api.qrserver.com/v1/create-qr-code/';

export function buildQrImageUrl(invitationUrl, size = INVITATION_QR_SIZE) {
  if (!invitationUrl) return '';
  const safeSize = Math.max(128, Math.min(512, Number(size) || INVITATION_QR_SIZE));
  const params = new URLSearchParams({
    size: `${safeSize}x${safeSize}`,
    margin: '8',
    data: invitationUrl
  });
  return `${QR_IMAGE_ENDPOINT}?${params.toString()}`;
}

export function buildNfcWriteMessage(invitationUrl) {
  if (!invitationUrl) return null;
  return {
    records: [
      {
        recordType: 'url',
        data: invitationUrl
      }
    ]
  };
}

export function supportsWebNfc(globalLike = globalThis) {
  return typeof globalLike?.NDEFReader === 'function';
}
