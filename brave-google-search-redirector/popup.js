document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('master-toggle');
  const statusDot = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');
  const statusDesc = document.getElementById('status-desc');
  const domainSelect = document.getElementById('domain-select');
  const interceptYahoo = document.getElementById('intercept-yahoo');
  const interceptBing = document.getElementById('intercept-bing');
  const redirectCountEl = document.getElementById('redirect-count');
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  const DEFAULT_SETTINGS = {
    enabled: true,
    googleDomain: 'google.co.jp',
    redirectCount: 0,
    interceptYahoo: true,
    interceptBing: true
  };

  // Load saved settings
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);

  // Update UI state
  masterToggle.checked = settings.enabled;
  domainSelect.value = settings.googleDomain || 'google.co.jp';
  interceptYahoo.checked = settings.interceptYahoo;
  interceptBing.checked = settings.interceptBing;
  redirectCountEl.textContent = settings.redirectCount || 0;

  updateStatusUI(settings.enabled);

  // Status UI helper
  function updateStatusUI(enabled) {
    if (enabled) {
      statusDot.classList.remove('off');
      statusLabel.textContent = '転送機能：有効';
      statusDesc.textContent = 'アドレスバー検索をGoogleへ転送中';
    } else {
      statusDot.classList.add('off');
      statusLabel.textContent = '転送機能：無効';
      statusDesc.textContent = '通常通りの検索結果を表示します';
    }
  }

  // Master Toggle Change
  masterToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.local.set({ enabled });
    updateStatusUI(enabled);
  });

  // Domain Select Change
  domainSelect.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ googleDomain: e.target.value });
  });

  // Checkbox Changes
  interceptYahoo.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ interceptYahoo: e.target.checked });
  });

  interceptBing.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ interceptBing: e.target.checked });
  });

  // Reset Stats
  resetStatsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ redirectCount: 0 });
    redirectCountEl.textContent = '0';
  });

  // Test Search Form Submit
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    const domain = domainSelect.value || 'google.co.jp';
    const targetUrl = `https://www.${domain}/search?q=${encodeURIComponent(query)}`;
    
    // Open in current tab or new tab
    chrome.tabs.create({ url: targetUrl });
  });

  // Periodically refresh stats if popup remains open
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.redirectCount) {
      redirectCountEl.textContent = changes.redirectCount.newValue || 0;
    }
  });
});
