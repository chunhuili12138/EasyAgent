import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatCitationAnchor,
  groupCitations,
  normalizeAssistantContent,
  normalizeCitations,
  parseAssistantMarkdown
} from './chat-display';

test('groups chunk citations by source document without losing chunk details', () => {
  const groups = groupCitations([
    { fileName: 'manual.docx', chunkId: 1, anchor: 'Section 1' },
    { fileName: 'manual.docx', chunkId: 2, anchor: 'Section 2' },
    { fileName: 'policy.pdf', chunkId: 3, anchor: 'Chapter 3' }
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].fileName, 'manual.docx');
  assert.deepEqual(
    groups[0].items.map(item => item.chunkId),
    [1, 2]
  );
  assert.equal(groups[1].fileName, 'policy.pdf');
});

test('normalizes both map and array citation payloads', () => {
  const citation = { fileName: 'manual.docx', chunkId: 1 };

  assert.deepEqual(normalizeCitations({ chunk_1: citation }), [citation]);
  assert.deepEqual(normalizeCitations([citation]), [citation]);
  assert.deepEqual(normalizeCitations(null), []);
});

test('formats structured heading anchors as readable breadcrumbs', () => {
  assert.equal(
    formatCitationAnchor('{"h1":"Manual","h2":"After-sales","h3":"Feedback"}'),
    'Manual / After-sales / Feedback'
  );
  assert.equal(formatCitationAnchor('Appendix'), 'Appendix');
  assert.equal(formatCitationAnchor(''), '');
});

test('renders GFM tables inside a horizontally scrollable wrapper', () => {
  const html = parseAssistantMarkdown('| 订单号 | 状态 | 金额 |\n| --- | --- | ---: |\n| A-001 | 待处理 | 8888.00 |');

  assert.match(html, /<div class="rag-table-wrap"><table>/);
  assert.match(html, /<th>订单号<\/th>/);
  assert.match(html, /<td align="right">8888\.00<\/td>/);
});

test('normalizes stream artifacts and removes internal citation tags before rendering', () => {
  assert.equal(normalizeAssistantContent('nullnull 正常内容 nullnull'), '正常内容');
  assert.doesNotMatch(parseAssistantMarkdown('答案<ref id="chunk_1"/>'), /<ref/i);
});
