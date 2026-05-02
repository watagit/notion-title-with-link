const NOTION_URL_PATTERN = /^https:\/\/(www\.notion\.so|[^/]+\.notion\.site)\//;

// Toolbar icon stays as a fallback in case the in-page button can't be injected
// (e.g., if Notion renames its topbar class). The content script handles the copy.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !NOTION_URL_PATTERN.test(tab.url)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'copy-title-with-link' });
  } catch {
    // Content script not ready yet; nothing to do.
  }
});
