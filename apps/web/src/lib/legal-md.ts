/**
 * Küçük, bağımsız markdown → HTML dönüştürücü.
 * Ekstra paket eklememek için sınırlı ama yeterli feature set:
 * - H1-H4, paragraphs
 * - Bold (**), italic (*), inline code (`)
 * - Ordered / unordered lists
 * - Blockquotes
 * - Tables (basic GFM)
 * - Links (Markdown ve auto-linked emails)
 * - Horizontal rules (---)
 * - Emoji (unicode passthrough)
 *
 * Güvenlik: input dosyalardan geliyor (kullanıcı input değil),
 * ama yine de basit HTML escape uygulanır.
 */
import fs from "node:fs/promises";
import path from "node:path";

/** Basic HTML escape */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline markdown: bold, italic, code, links */
function inline(s: string): string {
  return esc(s)
    // Code first
    .replace(/`([^`]+)`/g, '<code class="rounded bg-navy/[0.06] px-1.5 py-0.5 font-mono text-[0.9em]">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic — avoid crossing already-processed strong
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    // Markdown link [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, url: string) => {
      const isInternal = url.startsWith("/") || url.startsWith("#");
      const attrs = isInternal
        ? 'class="text-navy underline hover:text-navy-800"'
        : 'class="text-navy underline hover:text-navy-800" target="_blank" rel="noopener noreferrer"';
      return `<a href="${url}" ${attrs}>${text}</a>`;
    })
    // Auto-link email addresses (only outside markdown link syntax)
    .replace(/(^|\s)([\w.+-]+@[\w-]+\.[\w.-]+)/g, '$1<a href="mailto:$2" class="text-navy underline hover:text-navy-800">$2</a>');
}

interface TableRow {
  cells: string[];
}

/** Convert a markdown table block to HTML */
function renderTable(lines: string[]): string {
  if (lines.length < 2) return lines.join("\n");
  const parseRow = (line: string): TableRow => {
    const cells = line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
    return { cells };
  };
  const header = parseRow(lines[0]!);
  // lines[1] is the separator (---|---)
  const rows = lines.slice(2).filter((l) => l.trim()).map(parseRow);

  const thead = `<thead><tr>${header.cells
    .map((c) => `<th class="border-b border-navy/15 px-3 py-2 text-left text-sm font-semibold text-navy">${inline(c)}</th>`)
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${rows
    .map(
      (r, i) =>
        `<tr class="${i % 2 === 0 ? "bg-navy/[0.02]" : ""}">${r.cells
          .map((c) => `<td class="border-b border-navy/10 px-3 py-2 align-top text-sm text-charcoal">${inline(c)}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody>`;

  return `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse text-left">${thead}${tbody}</table></div>`;
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  let inBlockquote = false;
  let bqBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushList = () => {
    if (inList && listItems.length) {
      const tag = inList;
      const cls =
        tag === "ul"
          ? "my-3 list-disc space-y-1.5 pl-6 marker:text-navy/50"
          : "my-3 list-decimal space-y-1.5 pl-6 marker:text-navy/50";
      html.push(`<${tag} class="${cls}">${listItems.join("")}</${tag}>`);
    }
    inList = null;
    listItems = [];
  };

  const flushBlockquote = () => {
    if (inBlockquote && bqBuffer.length) {
      html.push(
        `<blockquote class="my-4 border-l-4 border-navy pl-4 italic text-charcoal/80">${bqBuffer
          .map((l) => `<p>${inline(l)}</p>`)
          .join("")}</blockquote>`,
      );
    }
    inBlockquote = false;
    bqBuffer = [];
  };

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      html.push(renderTable(tableBuffer));
    } else {
      // Not a valid table — output as paragraphs
      tableBuffer.forEach((l) => html.push(`<p>${inline(l)}</p>`));
    }
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const line = raw.trimEnd();

    // Table detection
    if (line.startsWith("|") && line.endsWith("|") && line.includes("|", 1)) {
      flushList();
      flushBlockquote();
      tableBuffer.push(line);
      continue;
    }
    if (tableBuffer.length && !(line.startsWith("|") && line.endsWith("|"))) {
      flushTable();
    }

    // Blank line
    if (!line) {
      flushList();
      flushBlockquote();
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line) || /^={3,}$/.test(line)) {
      flushList();
      flushBlockquote();
      html.push('<hr class="my-8 border-navy/15" />');
      continue;
    }

    // Headings
    const h = /^(#{1,4})\s+(.+)$/.exec(line);
    if (h) {
      flushList();
      flushBlockquote();
      const level = h[1]!.length;
      const cls =
        level === 1
          ? "mt-8 text-4xl font-bold text-navy first:mt-0"
          : level === 2
            ? "mt-8 text-2xl font-bold text-navy"
            : level === 3
              ? "mt-6 text-xl font-semibold text-navy"
              : "mt-4 text-lg font-semibold text-navy";
      html.push(`<h${level} class="${cls}">${inline(h[2]!)}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      inBlockquote = true;
      bqBuffer.push(line.slice(2));
      continue;
    }
    if (inBlockquote && !line.startsWith(">")) flushBlockquote();

    // Ordered list
    const ol = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ol) {
      if (inList !== "ol") {
        flushList();
        inList = "ol";
      }
      listItems.push(`<li>${inline(ol[2]!)}</li>`);
      continue;
    }

    // Unordered list
    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (inList !== "ul") {
        flushList();
        inList = "ul";
      }
      listItems.push(`<li>${inline(ul[1]!)}</li>`);
      continue;
    }

    // If not list continues, flush
    if (inList) flushList();

    // Paragraph
    html.push(`<p class="my-3 leading-relaxed text-charcoal">${inline(line)}</p>`);
  }

  flushList();
  flushBlockquote();
  flushTable();

  return html.join("\n");
}

/** Read a markdown file from the legal/ directory */
export async function loadLegalMarkdown(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), "..", "..", "legal", "tr", fileName);
  return fs.readFile(filePath, "utf-8");
}
