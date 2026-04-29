function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const binary = decodeBase64Url(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = typeof TextDecoder !== "undefined"
      ? new TextDecoder().decode(bytes)
      : decodeURIComponent(binary.split("").map((char) =>
        `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
      ).join(""));

    return JSON.parse(json);
  } catch {
    return null;
  }
}
