const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|mkv)($|[?#])/i

function isVideoUrl(url) {
  if (!url) return false
  if (VIDEO_URL_PATTERN.test(url)) return true

  // Feather/OpenAI asset redirects do not expose file extension in URL.
  // We treat these endpoints as likely-video sources for 360 playback.
  if (url.includes('feather.openai.com/api/assets/') && url.includes('/redirect?')) {
    return true
  }

  return false
}

function isExtensionPage(url) {
  return typeof url === 'string' && url.startsWith('chrome-extension://')
}

function redirectToViewer(tabId, url) {
  if (!isVideoUrl(url)) return
  if (isExtensionPage(url)) return

  const viewerUrl = chrome.runtime.getURL('index.html') + '?src=' + encodeURIComponent(url)
  chrome.tabs.update(tabId, { url: viewerUrl })
}

// Trigger when URL changes in an existing tab.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const nextUrl = changeInfo.url || tab.pendingUrl || tab.url
  redirectToViewer(tabId, nextUrl)
})

// Trigger right when a new tab is opened (helps with very fast redirect links).
chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.id) return
  const nextUrl = tab.pendingUrl || tab.url
  redirectToViewer(tab.id, nextUrl)
})

// Trigger on committed top-level navigations (more reliable on some media navigations).
chrome.webNavigation.onCommitted.addListener(
  (details) => {
    if (details.frameId !== 0) return
    redirectToViewer(details.tabId, details.url)
  },
  { url: [{ schemes: ['http', 'https'] }] }
)
