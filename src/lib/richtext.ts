/**
 * Safe, dependency-free mini-markdown for the richText block (Tier 3A).
 *
 * The client never writes raw HTML: the input is fully HTML-escaped first, then
 * a small whitelist of inline markdown is converted to OUR OWN tags. Any literal
 * HTML the client types is shown as text, and link hrefs are restricted to
 * http(s) / mailto / site-relative. The output is therefore safe to inject with
 * `set:html` because every tag in it was produced here, not by the author.
 *
 * Supported: paragraphs (blank line), single-line breaks, **bold**, *italic* /
 * _italic_, `code`, and [text](url). Nothing else — by design.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function safeHref(raw: string): string | null {
  const h = raw.replace(/&amp;/g, '&').trim();
  if (/^javascript:/i.test(h)) return null;
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(h)) return h;
  return null;
}

// `text` is already HTML-escaped before this runs.
function inline(text: string): string {
  let s = text;
  // [label](url) — label keeps its escaped form; href is validated + re-escaped.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const href = safeHref(url);
    if (!href) return label;
    const ext = /^https?:/i.test(href);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
  s = s.replace(/_([^_\s][^_]*?)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

export function renderRichText(markdown: string): string {
  if (!markdown) return '';
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((para) => {
      const html = escapeHtml(para)
        .split('\n')
        .map((line) => inline(line))
        .join('<br>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}
