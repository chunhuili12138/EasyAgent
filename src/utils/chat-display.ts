import type { Tokens } from 'marked';
import { marked } from 'marked';

export interface ChatCitation {
  fileName?: string;
  chunkId?: number | string;
  anchor?: string | Record<string, unknown>;
  snippet?: string;
  [key: string]: unknown;
}

export interface CitationGroup {
  key: string;
  fileName: string;
  items: ChatCitation[];
}

export function normalizeCitations(value: unknown): ChatCitation[] {
  if (Array.isArray(value)) return value.filter(isCitation);
  if (value && typeof value === 'object') return Object.values(value).filter(isCitation);
  return [];
}

export function groupCitations(citations: ChatCitation[] | undefined): CitationGroup[] {
  const groups = new Map<string, CitationGroup>();

  for (const [index, citation] of (citations || []).entries()) {
    const fileName = typeof citation.fileName === 'string' ? citation.fileName.trim() : '';
    const key = fileName ? `file:${fileName}` : `chunk:${citation.chunkId ?? index}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(citation);
    } else {
      groups.set(key, { key, fileName, items: [citation] });
    }
  }

  return [...groups.values()];
}

export function formatCitationAnchor(anchor: ChatCitation['anchor']): string {
  const parsed = parseAnchor(anchor);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const headings = Object.entries(parsed)
      .sort(([left], [right]) => headingRank(left) - headingRank(right))
      .map(([, value]) => String(value || '').trim())
      .filter(Boolean);
    if (headings.length) return headings.join(' / ');
  }
  if (typeof anchor === 'string' && anchor.trim()) return anchor.trim();
  return '';
}

export function normalizeAssistantContent(content: string): string {
  return content
    .replace(/^(?:null){2,}/, '')
    .replace(/(?:null)+$/, '')
    .trim();
}

export function parseAssistantMarkdown(content: string): string {
  const renderer = new marked.Renderer();
  const renderTable = renderer.table.bind(renderer);
  renderer.table = (token: Tokens.Table) => `<div class="rag-table-wrap">${renderTable(token)}</div>`;

  const markdown = normalizeAssistantContent(content).replace(/<ref\s+id=["'][^"']+["']\s*\/?\s*>/gi, '');
  return marked.parse(markdown, { breaks: true, gfm: true, renderer, async: false }) as string;
}

function isCitation(value: unknown): value is ChatCitation {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseAnchor(anchor: ChatCitation['anchor']): unknown {
  if (!anchor || typeof anchor !== 'string') return anchor;
  try {
    return JSON.parse(anchor);
  } catch {
    return anchor;
  }
}

function headingRank(key: string): number {
  const match = /^h(\d+)$/i.exec(key);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}
