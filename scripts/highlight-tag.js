'use strict';

// Hexo filter to process {% marker ... %} tags and ==...== syntax for marker/highlighter effect
hexo.extend.filter.register('before_post_render', function(data) {
  // Extract code blocks first, replace with placeholders to avoid processing their content
  const codeBlocks = [];
  data.content = data.content.replace(/(```[\s\S]*?```|`[^`]*`)/g, function(match) {
    codeBlocks.push(match);
    return `\x00CODEBLOCK_${codeBlocks.length - 1}\x00`;
  });

  // Support ==...== syntax (matches any character including newlines)
  data.content = data.content.replace(/==([\s\S]*?)==/g, '<span class="marker">$1</span>');
  // Support {% marker ... %} syntax
  data.content = data.content.replace(/\{%\s*marker\s+([\s\S]*?)\s*%\}/g, '<span class="marker">$1</span>');

  // Restore code blocks
  data.content = data.content.replace(/\x00CODEBLOCK_(\d+)\x00/g, function(_, i) {
    return codeBlocks[parseInt(i)];
  });

  return data;
});
