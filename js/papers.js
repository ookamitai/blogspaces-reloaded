(function () {
  'use strict';
  var key = 'paper-reading-progress-v1';
  var read = {};
  var storageAvailable = true;
  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(key) || '{}');
      read = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
      storageAvailable = true;
    } catch (error) { read = {}; storageAvailable = false; }
  }
  loadProgress();

  document.querySelectorAll('.main-nav-link, .mobile-nav-link').forEach(function (link) {
    if (new URL(link.href).pathname.replace(/\/$/, '') === '/papers') link.setAttribute('aria-current', 'page');
  });

  var note = document.querySelector('[data-paper-note]');
  var mark = document.getElementById('paper-mark-read');
  if (note && mark) {
    mark.hidden = false;
    var id = note.dataset.paperId;
    function paint() {
      mark.setAttribute('aria-pressed', read[id] ? 'true' : 'false');
      mark.textContent = read[id] ? '已读 · 点击撤销' : '标记为已读';
    }
    paint();
    mark.addEventListener('click', function () {
      if (read[id]) delete read[id];
      else read[id] = true;
      try {
        localStorage.setItem(key, JSON.stringify(read));
        document.getElementById('paper-save-status').textContent = read[id] ? '已保存到当前浏览器' : '已撤销已读标记';
      } catch (error) { document.getElementById('paper-save-status').textContent = '浏览器无法保存进度，本次标记仅在当前页面有效'; }
      paint();
    });
    window.addEventListener('pageshow', function () { loadProgress(); paint(); });
    window.addEventListener('storage', function (event) { if (event.key === key || event.key === null) { loadProgress(); paint(); } });
  }

  var library = document.querySelector('[data-paper-library]');
  if (!library) return;
  var search = document.getElementById('paper-search');
  var topic = document.getElementById('paper-topic');
  var verification = document.getElementById('paper-verification');
  var progress = document.getElementById('paper-progress');
  var count = document.getElementById('paper-result-count');
  var empty = document.getElementById('paper-empty');
  var rows = Array.from(document.querySelectorAll('.paper-row')).map(function (element) {
    var isRead = !!read[element.dataset.paperId];
    element.querySelector('.paper-read-indicator').hidden = !isRead;
    return { element: element, search: normalize(element.dataset.search), topics: JSON.parse(element.dataset.topics), verification: element.dataset.verification, read: isRead };
  });
  function normalize(value) { return value.normalize('NFKC').toLocaleLowerCase().replace(/[‐‑–—-]/g, ' '); }

  var params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  topic.value = params.get('topic') || '';
  verification.value = params.get('verification') || '';
  progress.value = params.get('progress') || '';

  function filter(save) {
    var words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    var visible = 0;
    rows.forEach(function (row) {
      var match = words.every(function (word) { return row.search.includes(word); }) &&
        (!topic.value || row.topics.includes(topic.value)) && (!verification.value || row.verification === verification.value) &&
        (!progress.value || (progress.value === 'read' ? row.read : !row.read));
      row.element.hidden = !match;
      if (match) visible++;
    });
    document.querySelectorAll('.paper-stage-heading').forEach(function (heading) {
      heading.hidden = !rows.some(function (row) { return !row.element.hidden && row.element.dataset.paperStage === heading.dataset.paperStage; });
    });
    count.textContent = '显示 ' + visible + ' / ' + rows.length + ' 篇';
    empty.hidden = visible !== 0;
    if (save) {
      var url = new URL(window.location.href);
      [['q', search.value.trim()], ['topic', topic.value], ['verification', verification.value], ['progress', progress.value]].forEach(function (entry) {
        if (entry[1]) url.searchParams.set(entry[0], entry[1]);
        else url.searchParams.delete(entry[0]);
      });
      window.history.replaceState(null, '', url);
    }
  }
  search.addEventListener('input', function () { filter(true); });
  [topic, verification, progress].forEach(function (control) { control.addEventListener('change', function () { filter(true); }); });
  document.getElementById('paper-reset').addEventListener('click', function () {
    search.value = ''; topic.value = ''; verification.value = ''; progress.value = ''; filter(true); search.focus();
  });
  if (!storageAvailable) document.getElementById('paper-storage-note').textContent = '当前浏览器无法读取已保存的阅读进度。';
  function refreshProgress() {
    loadProgress();
    rows.forEach(function (row) {
      row.read = !!read[row.element.dataset.paperId];
      row.element.querySelector('.paper-read-indicator').hidden = !row.read;
    });
    filter(false);
  }
  window.addEventListener('pageshow', refreshProgress);
  window.addEventListener('storage', function (event) { if (event.key === key || event.key === null) refreshProgress(); });
  filter(false);
})();
