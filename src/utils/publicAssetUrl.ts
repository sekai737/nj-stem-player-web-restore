/**
 * Encode a public asset path for fetch/XHR (spaces and other chars in folder names).
 * `/stems/right now/foo.flac` → `/stems/right%20now/foo.flac`
 */
export function publicAssetUrl(src: string): string {
  if (!src.startsWith("/")) return encodeURI(src);

  const parts = src.split("/");
  return parts
    .map((part, index) => (index === 0 ? "" : encodeURIComponent(part)))
    .join("/");
}
