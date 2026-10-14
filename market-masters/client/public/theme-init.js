(function () {
  var saved;
  try { saved = localStorage.getItem('finopoly:theme'); } catch (_) {}
  var theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#131C29' : '#F5F7FA';
})();
