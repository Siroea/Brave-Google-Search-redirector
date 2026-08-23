(async function () {
  try {
    const settings = await chrome.storage.local.get({
      enabled: true,
      googleDomain: 'google.co.jp',
      interceptYahoo: true,
      interceptBing: true
    });

    if (!settings.enabled) return;

    const urlObj = new URL(window.location.href);
    const host = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname.toLowerCase();

    let query = null;

    if ((host.includes('yahoo.co.jp') || host.includes('yahoo.com')) && settings.interceptYahoo) {
      if (path.includes('/search')) {
        query = urlObj.searchParams.get('p') || urlObj.searchParams.get('q');
      }
    } else if (host.includes('bing.com') && settings.interceptBing) {
      if (path.includes('/search')) {
        query = urlObj.searchParams.get('q');
      }
    }

    if (query && query.trim() !== '') {
      const domain = settings.googleDomain || 'google.co.jp';
      const targetUrl = `https://www.${domain}/search?q=${encodeURIComponent(query)}`;

      if (window.location.href !== targetUrl) {
        console.log('[GoogleRedirector ContentScript] Failsafe redirecting to Google...');
        window.location.replace(targetUrl);
      }
    }
  } catch (e) {
    console.error('[GoogleRedirector ContentScript] Error:', e);
  }
})();
