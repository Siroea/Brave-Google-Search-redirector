// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  googleDomain: 'google.co.jp', // 'google.co.jp' or 'google.com'
  redirectCount: 0,
  interceptYahoo: true,
  interceptBing: true,
  interceptDDG: false
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  const updated = { ...DEFAULT_SETTINGS, ...current };
  await chrome.storage.local.set(updated);
  console.log('[GoogleRedirector] Service worker initialized with settings:', updated);
});

// Helper to extract search query from URL
function getSearchQuery(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  const path = urlObj.pathname.toLowerCase();

  // Yahoo! Search (Japan & Global) -> uses 'p' or 'q'
  if (host.includes('yahoo.co.jp') || host.includes('yahoo.com')) {
    if (path.includes('/search')) {
      return urlObj.searchParams.get('p') || urlObj.searchParams.get('q');
    }
  }

  // Bing -> uses 'q'
  if (host.includes('bing.com')) {
    if (path.includes('/search')) {
      return urlObj.searchParams.get('q');
    }
  }

  // DuckDuckGo -> uses 'q'
  if (host.includes('duckduckgo.com')) {
    return urlObj.searchParams.get('q');
  }

  return null;
}

// Navigation listener for fast instant redirection before page load
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only target top-level main frame navigation
  if (details.frameId !== 0) return;

  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    if (!settings.enabled) return;

    const urlObj = new URL(details.url);
    const host = urlObj.hostname.toLowerCase();

    // Check if target is enabled in settings
    if (host.includes('yahoo') && !settings.interceptYahoo) return;
    if (host.includes('bing') && !settings.interceptBing) return;
    if (host.includes('duckduckgo') && !settings.interceptDDG) return;

    const query = getSearchQuery(urlObj);
    if (query && query.trim() !== '') {
      const domain = settings.googleDomain || 'google.co.jp';
      const targetGoogleUrl = `https://www.${domain}/search?q=${encodeURIComponent(query)}`;

      // Increment redirect statistics counter
      const newCount = (settings.redirectCount || 0) + 1;
      await chrome.storage.local.set({ redirectCount: newCount });

      console.log(`[GoogleRedirector] Redirecting search "${query}" from ${host} to Google (${domain})`);

      // Update tab URL to Google search
      chrome.tabs.update(details.tabId, { url: targetGoogleUrl });
    }
  } catch (err) {
    console.error('[GoogleRedirector] Error handling navigation:', err);
  }
});

// Omnibox "g" keyword handler
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  if (!text || text.trim() === '') return;

  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  const domain = settings.googleDomain || 'google.co.jp';
  const targetUrl = `https://www.${domain}/search?q=${encodeURIComponent(text.trim())}`;

  switch (disposition) {
    case 'currentTab':
      chrome.tabs.update({ url: targetUrl });
      break;
    case 'newForegroundTab':
      chrome.tabs.create({ url: targetUrl, active: true });
      break;
    case 'newBackgroundTab':
      chrome.tabs.create({ url: targetUrl, active: false });
      break;
  }
});
