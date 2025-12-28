'use strict';

// Hexo filter to process {% marker ... %} tags and ==...== syntax for marker/highlighter effect
hexo.extend.filter.register('before_post_render', function(data) {
  // Support ==...== syntax (matches any character including newlines)
  data.content = data.content.replace(/==([\s\S]*?)==/g, '<span class="marker">$1</span>');
  // Support {% marker ... %} syntax
  data.content = data.content.replace(/\{%\s*marker\s+([\s\S]*?)\s*%\}/g, '<span class="marker">$1</span>');
  return data;
});
