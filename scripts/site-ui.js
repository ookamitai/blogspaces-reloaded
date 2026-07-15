'use strict';

const themeDetection = `
<meta name="color-scheme" content="light dark">
<script data-site-theme-detection>
  (function () {
    if (window.__siteThemeDetectionInitialized) return;
    window.__siteThemeDetectionInitialized = true;

    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var saved;

    try {
      saved = localStorage.getItem('color-scheme');
    } catch (error) {
      saved = null;
    }

    function applyTheme(prefersDark) {
      var useDark = saved === 'dark' || (saved !== 'light' && prefersDark);
      root.classList.toggle('dark', useDark);
      root.style.colorScheme = useDark ? 'dark' : 'light';
    }

    applyTheme(media.matches);

    function handleChange(event) {
      if (saved !== 'dark' && saved !== 'light') applyTheme(event.matches);
    }

    if (media.addEventListener) media.addEventListener('change', handleChange);
    else if (media.addListener) media.addListener(handleChange);
  })();
</script>`;

hexo.extend.filter.register('after_render:html', html => {
  let result = html;

  if (!result.includes('data-site-theme-detection')) {
    result = result.replace(/<head(.*?)>/i, `<head$1>${themeDetection}`);
  }

  if (!result.includes('href="/css/custom.css"')) {
    result = result.replace('</head>', '  <link rel="stylesheet" href="/css/custom.css">\n</head>');
  }

  return result;
});
