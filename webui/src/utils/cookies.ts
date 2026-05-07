export function parseCookieString(cookieText: string): Record<string, string> {
  return cookieText
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separator = part.indexOf('=');
      if (separator <= 0) return cookies;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key) cookies[key] = value;
      return cookies;
    }, {});
}

export function hasCookieValue(cookieText?: string): boolean {
  return Object.keys(parseCookieString(cookieText ?? '')).length > 0;
}
