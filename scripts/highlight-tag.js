'use strict';

// Hexo filter to process {% marker ... %} tags for marker/highlighter effect
hexo.extend.filter.register('before_post_render', function(data) {
  // Replace {% marker text %} with <mark class="marker">text</mark>
  data.content = data.content.replace(/\{%\s*marker\s+(.*?)\s*%\}/g, '<mark class="marker">$1</mark>');
  return data;
});
