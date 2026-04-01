/** HTML entity escaping for safe text injection into WeasyPrint HTML. */
export function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip potentially dangerous HTML constructs from user-generated block content. */
export function sanitize(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "");
}

/** Convert a single Tiptap/ProseMirror block to WeasyPrint-compatible HTML. */
export function cyrBlockToHtml(b: any): string {
  const raw = b.content || b.text || "";
  if (!raw && b.type !== "divider") return "";
  const content = sanitize(raw);
  const indentLevel = Math.max(0, Math.min(8, Number(b.metadata?.indentLevel ?? 0)));
  const indentEm   = indentLevel * 1.8;
  const nestBorder = indentLevel > 0 ? ";border-left:2px solid rgba(0,0,0,0.10);padding-left:0.5em" : "";
  const indentAttr = indentLevel > 0
    ? ` style="margin-left:${indentEm}em;text-indent:0${nestBorder}"`
    : "";

  switch (b.type) {
    case "h1":
    case "heading":       return `<h2 class="section-h1">${content}</h2>`;
    case "h2":            return `<h3 class="section-h2">${content}</h3>`;
    case "h3":            return `<h4 class="section-h3">${content}</h4>`;
    case "quote":         return `<blockquote style="margin-left:${indentEm}em${nestBorder}">${content}</blockquote>`;
    case "bullet_item": {
      const ml = (indentLevel + 1) * 1.8;
      return `<p class="list-bullet" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">&#8226;&nbsp;${content}</p>`;
    }
    case "numbered_item": {
      const ml = (indentLevel + 1) * 1.8;
      return `<p class="list-numbered" style="margin-left:${ml}em;text-indent:0${nestBorder}">${content}</p>`;
    }
    case "check_item": {
      const ml = (indentLevel + 1) * 1.8;
      const checked = b.metadata?.checked ? "&#9745;" : "&#9744;";
      return `<p class="list-check" style="margin-left:${ml}em;text-indent:-1.4em;padding-left:0${nestBorder}">${checked}&nbsp;${content}</p>`;
    }
    case "hypothesis":      return `<div class="callout callout-hypothesis" style="margin-left:${indentEm}em"><span class="callout-icon">&#9670;</span><div>${content}</div></div>`;
    case "argument":        return `<div class="callout callout-argument" style="margin-left:${indentEm}em"><span class="callout-icon">&#10003;</span><div>${content}</div></div>`;
    case "counterargument": return `<div class="callout callout-counter" style="margin-left:${indentEm}em"><span class="callout-icon">&#10007;</span><div>${content}</div></div>`;
    case "idea":            return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#9861;</span><div>${content}</div></div>`;
    case "question":        return `<div class="callout callout-question" style="margin-left:${indentEm}em"><span class="callout-icon">?</span><div>${content}</div></div>`;
    case "observation":     return `<div class="callout callout-idea" style="margin-left:${indentEm}em"><span class="callout-icon">&#128065;</span><div>${content}</div></div>`;
    case "divider":         return `<hr class="divider"/>`;
    default:                return `<p${indentAttr}>${content}</p>`;
  }
}
