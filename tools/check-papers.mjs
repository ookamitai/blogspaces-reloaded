import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const katex = require('katex');
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const library = JSON.parse(fs.readFileSync(path.join(root, 'source/_data/papers.json'), 'utf8'));
const papers = library.papers;
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

assert(papers.length > 0, 'The paper library must not be empty');
assert.equal(new Set(papers.map(p => p.id)).size, papers.length, 'Duplicate paper IDs');
assert.equal(new Set(papers.map(p => p.slug)).size, papers.length, 'Duplicate paper routes');

// Preserve every source entry, including both entries numbered #41.
const expected = [
  ...Array.from({ length: 89 }, (_, i) => `研究想法 #${i + 1}`),
  '研究想法 #41（第二个同号条目）',
  ...Array.from({ length: 51 }, (_, i) => `对齐论文表 #${i + 1}`),
  ...Array.from({ length: 7 }, (_, i) => `密度比论文表 #${i + 1}`)
];
const actual = papers.flatMap(p => p.source_refs);
assert.equal(actual.length, library.raw_count, 'Source-record count differs from the library count');
assert.deepEqual([...actual].sort(), expected.sort(), 'Missing or duplicated source records');

const index = cheerio.load(read('public/papers/index.html'));
assert.equal(index('.paper-row').length, papers.length, 'The generated directory is incomplete');
assert.equal(index('.paper-stage-heading').length, library.stages.length, 'Missing reading stages');
assert.equal(index('.paper-row').first().attr('data-paper-id'), papers[0].id);

const routes = ['papers/index.html', 'papers/guide/index.html'];
let formulas = 0;
for (const [i, paper] of papers.entries()) {
  assert.equal(paper.reading_order, i + 1, `${paper.id}: reading order is not sequential`);
  assert(library.stages.some(stage => stage.name === paper.stage), `${paper.id}: unknown stage`);
  assert(['fulltext', 'abstract', 'excerpt'].includes(paper.verification));
  assert(paper.verification_note.length > 10, `${paper.id}: missing evidence description`);
  if (paper.verification !== 'excerpt') assert(new URL(paper.source_url).protocol === 'https:');
  const source = read(`source/papers/${paper.slug}/index.md`);
  const authored = source.split('<details class="paper-source-excerpt">')[0];
  assert((authored.match(/^## /gm) || []).length >= 5, `${paper.id}: incomplete study note`);
  assert(/自测/.test(authored), `${paper.id}: no self-assessment`);
  assert(/实验/.test(authored), `${paper.id}: no study experiment`);
  assert((authored.match(/==[^\n]+?==/g) || []).length >= 2, `${paper.id}: missing key highlights`);
  const html = cheerio.load(read(`public/papers/${paper.slug}/index.html`));
  assert.equal(html('[data-paper-note]').attr('data-paper-id'), paper.id, `${paper.id}: wrong note template`);
  assert(html('.paper-note-body .marker').length >= 2, `${paper.id}: highlights did not render`);
  assert.equal(html('.paper-pagination a').length, i === 0 || i === papers.length - 1 ? 1 : 2);
  routes.push(`papers/${paper.slug}/index.html`);
  for (const match of authored.matchAll(/\$\$([\s\S]+?)\$\$|(?<!\\)\$([^\n$]+?)(?<!\\)\$/g)) {
    katex.renderToString(match[1] || match[2], { throwOnError: true, strict: false, displayMode: !!match[1] });
    formulas++;
  }
}

for (const route of routes) {
  const $ = cheerio.load(read(`public/${route}`));
  assert.equal($('head link[href="/css/papers.css"]').length, 1, `${route}: missing or duplicate stylesheet`);
  assert.equal($('script[src="/js/papers.js"]').length, 1, `${route}: missing or duplicate client script`);
  $('.papers-shell a[href], .papers-shell img[src]').each((_, element) => {
    const target = $(element).attr('href') || $(element).attr('src');
    if (/^(?:https?:|mailto:|#)/.test(target)) return;
    const url = new URL(target, `https://local.invalid/${route}`);
    let file = decodeURIComponent(url.pathname);
    if (file.endsWith('/')) file += 'index.html';
    assert(exists(`public${file}`), `${route}: broken local link ${target}`);
  });
}

console.log(`Paper checks passed: ${papers.length} notes, ${actual.length} source entries, ${library.stages.length} stages, ${formulas} valid LaTeX expressions; all local links and figures resolve.`);
