const NOTION_URL_PATTERN = /^https:\/\/(www\.notion\.so|[^/]+\.notion\.site)\//;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !NOTION_URL_PATTERN.test(tab.url)) {
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: copyTitleWithLink,
  });
});

function copyTitleWithLink() {
  const url = window.location.href;

  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const rawTitle = (ogTitle || document.title || '').trim();
  const title = rawTitle.replace(/\s*[-|–—]\s*Notion\s*$/i, '').trim() || url;

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const html = `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;
  const text = `${title} ${url}`;

  const showToast = (message, ok) => {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      `background:${ok ? '#111' : '#b00020'}`,
      'color:#fff',
      'padding:10px 14px',
      'border-radius:6px',
      'font:13px system-ui,-apple-system,sans-serif',
      'z-index:2147483647',
      'box-shadow:0 4px 12px rgba(0,0,0,.2)',
      'max-width:360px',
    ].join(';');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  };

  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([text], { type: 'text/plain' }),
  });

  navigator.clipboard.write([item]).then(
    () => showToast(`Copied: ${title}`, true),
    (err) => showToast(`Copy failed: ${err?.message ?? err}`, false),
  );
}
