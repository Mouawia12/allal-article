const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SEGMENT_LENGTH = 4;

function randomSegment(cryptoSource = globalThis.crypto) {
  if (!cryptoSource?.getRandomValues) {
    throw new Error("Secure random generator unavailable");
  }

  const values = new Uint8Array(SEGMENT_LENGTH);
  cryptoSource.getRandomValues(values);

  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
}

export function generateInviteCode(cryptoSource = globalThis.crypto) {
  return `LINK-${randomSegment(cryptoSource)}-${randomSegment(cryptoSource)}`;
}
