// Apply the theme before the app and its styles load to avoid a bright flash.
(function () {
  var preference;
  try { preference = localStorage.getItem('finopoly:theme'); } catch (_) { /* Storage can be blocked. */ }
  var theme = preference === 'light' || preference === 'dark'
    ? preference
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#131C29' : '#F5F7FA';
})();
