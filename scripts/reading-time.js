"use strict";

function _word_count_raw(post) {
  var content = post.content || post._content || '';
  var stripped = content.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, '');
  var cnChars = (stripped.match(/[\u4e00-\u9fff]/g) || []).length;
  var enWords = stripped.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  return cnChars + enWords;
}

function _word_count_rounded(post) {
  var total = _word_count_raw(post);
  return Math.max(0, Math.round(total / 100) * 100);
}

hexo.extend.helper.register('reading_time', function(post) {
  var content = post.content || post._content || '';
  var stripped = content.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, '');
  var words = stripped.match(/[\u4e00-\u9fff]/g);
  var cnChars = words ? words.length : 0;
  var enWords = stripped.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  var minutes = Math.ceil(cnChars / 400 + enWords / 200);
  return Math.max(1, minutes);
});

// New: word count as rounded hundred
hexo.extend.helper.register('word_count', function(post) {
  return _word_count_rounded(post);
});

// New: formatted word count (e.g. 1200 -> '1.2k', 1000 -> '1k', <1000 stays as number)
hexo.extend.helper.register('word_count_formatted', function(post) {
  var n = _word_count_rounded(post);
  if (n >= 1000) {
    var v = (n / 1000).toFixed(1);
    if (v.indexOf('.0') !== -1) v = v.replace('.0', '');
    return v + 'k';
  }
  return String(n);
});

/* duplicate old word_count removed to keep only formatted version */
