'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Keep these views in the site repository: mashiro is a Git submodule.
hexo.extend.filter.register('before_generate', () => {
  for (const name of ['papers', 'paper', 'paper-guide']) {
    hexo.theme.setView(`${name}.ejs`, fs.readFileSync(path.join(hexo.base_dir, 'layouts', `${name}.ejs`), 'utf8'));
  }
});

hexo.extend.helper.register('paper_verification_label', level => ({
  fulltext: '已查阅全文',
  abstract: '已核验摘要',
  excerpt: '原文待核验'
}[level] || '原文待核验'));

hexo.extend.filter.register('after_render:html', html => {
  if (!html.includes('data-paper-') || !html.includes('</head>')) return html;
  return html.replace('</head>', '  <link rel="stylesheet" href="/css/papers.css">\n</head>')
    .replace('</body>', '  <script src="/js/papers.js" defer></script>\n</body>');
});
