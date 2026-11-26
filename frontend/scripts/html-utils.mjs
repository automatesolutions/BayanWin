/** Visible words inside <main>: the same text the AdSense reviewer judges a page by. */
export function mainWordCount(html) {
  const main = html.match(/<main[\s>][\s\S]*<\/main>/)?.[0] ?? '';
  return main
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9₱]/.test(w)).length;
}
