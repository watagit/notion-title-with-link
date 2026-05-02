const BTN_ID = 'ntwl-copy-btn';
const STYLE_ID = 'ntwl-style';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTitleAndUrl() {
  const url = window.location.href;
  // document.title is updated by Notion's SPA to the current page name.
  // og:title is the static marketing title, only useful as a fallback.
  const docTitle = (document.title || '').trim();
  const ogTitle = (document.querySelector('meta[property="og:title"]')?.content || '').trim();
  const rawTitle = docTitle || ogTitle;
  const title = rawTitle.replace(/\s*[-|–—]\s*Notion\s*$/i, '').trim() || url;
  return { title, url };
}

function showToast(message, ok) {
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
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

async function copyTitleWithLink() {
  const { title, url } = getTitleAndUrl();
  const html = `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;
  const text = `${title} ${url}`;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    showToast(`Copied: ${title}`, true);
  } catch (err) {
    showToast(`Copy failed: ${err?.message ?? err}`, false);
  }
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${BTN_ID} {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 8px;
      margin: 0 2px;
      border-radius: 4px;
      font: 500 14px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: rgba(55, 53, 47, 0.65);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: background 60ms ease-in;
    }
    #${BTN_ID}:hover { background: rgba(55, 53, 47, 0.08); }
    .notion-dark-theme #${BTN_ID} { color: rgba(255, 255, 255, 0.65); }
    .notion-dark-theme #${BTN_ID}:hover { background: rgba(255, 255, 255, 0.08); }
  `;
  document.head.appendChild(style);
}

function buildButton() {
  const btn = document.createElement('div');
  btn.id = BTN_ID;
  btn.setAttribute('role', 'button');
  btn.tabIndex = 0;
  btn.title = 'Copy page title with link';
  btn.textContent = 'Copy link';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyTitleWithLink();
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyTitleWithLink();
    }
  });
  return btn;
}

function ensureButton() {
  if (document.getElementById(BTN_ID)) return;
  // Only inject into the dedicated action-buttons container on the right side of the
  // topbar. Falling back to the topbar root would overlap the breadcrumb on layouts
  // that position children absolutely.
  const actionArea = document.querySelector('.notion-topbar .notion-topbar-action-buttons');
  if (!actionArea) return;
  ensureStyle();
  actionArea.appendChild(buildButton());
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    ensureButton();
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });
ensureButton();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'copy-title-with-link') copyTitleWithLink();
});
