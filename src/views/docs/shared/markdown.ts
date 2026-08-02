import type { Token, Tokens } from 'marked';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/** 从标题文本生成稳定的锚点 id（保留中文与字母数字） */
function slugify(text: string): string {
  const plain = text.replace(/[[\]()!~<>&#`*_]/g, '').trim();
  const slug = plain
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-');
  return slug || 'section';
}

function tokenText(tokens: Token[]): string {
  return tokens
    .map(token => {
      if (token.type === 'text' || token.type === 'codespan') return token.text;
      return token.raw;
    })
    .join('');
}

const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }: Tokens.Heading) => {
  const text = tokenText(tokens);
  return `<h${depth} id="${slugify(text)}">${text}</h${depth}>`;
};

renderer.link = ({ href, title, tokens }: Tokens.Link) => {
  const text = tokenText(tokens);
  const isExternal = /^https?:\/\//.test(href || '');
  const extra = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr}${extra}>${text}</a>`;
};

/** 将 Markdown 渲染为安全的 HTML（复用平台 marked + DOMPurify 安全链路） */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { gfm: true, breaks: true, renderer, async: false }) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/**
 * 渲染后增强：表格滚动包裹、提示块、流程图、代码块复制按钮。
 *
 * @param container 已挂载 v-html 内容的容器
 * @param i18n 复制按钮文案
 */
export function enhanceDocsContent(container: HTMLElement, i18n: { copy: string; copied: string }) {
  container.querySelectorAll('table').forEach(table => {
    if (table.closest('.doc-table-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'doc-table-wrap';
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });

  container.querySelectorAll('blockquote').forEach(quote => {
    const firstStrong = quote.querySelector('strong');
    const label = firstStrong?.textContent?.trim() ?? '';
    let variant = '';
    if (/(注意|警告|小心|danger|warning)/i.test(label)) variant = 'doc-callout--warning';
    else if (/(提示|说明|info|tip)/i.test(label)) variant = 'doc-callout--info';
    else if (/(成功|success)/i.test(label)) variant = 'doc-callout--success';
    if (variant) quote.classList.add('doc-callout', variant);
  });

  container.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const lang = code?.className.match(/language-([\w+-]+)/)?.[1] ?? '';

    if (lang === 'flow' && code) {
      const flow = document.createElement('div');
      flow.className = 'doc-flow';
      code.textContent
        ?.split(/[\n,，]/)
        .map(step => step.trim())
        .filter(Boolean)
        .forEach(step => {
          const chip = document.createElement('span');
          chip.className = 'doc-flow-step';
          chip.textContent = step;
          flow.appendChild(chip);
        });
      pre.replaceWith(flow);
      return;
    }

    if (pre.querySelector('.doc-code-header')) return;
    const header = document.createElement('div');
    header.className = 'doc-code-header';
    const langSpan = document.createElement('span');
    langSpan.className = 'doc-code-lang';
    langSpan.textContent = lang || 'text';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'doc-copy-btn';
    copyBtn.textContent = i18n.copy;
    copyBtn.addEventListener('click', () => {
      const text = code?.textContent ?? '';
      navigator.clipboard?.writeText(text).then(() => {
        copyBtn.textContent = i18n.copied;
        setTimeout(() => {
          copyBtn.textContent = i18n.copy;
        }, 1500);
      });
    });
    header.appendChild(langSpan);
    header.appendChild(copyBtn);
    pre.classList.add('doc-code-block');
    pre.prepend(header);
  });
}
