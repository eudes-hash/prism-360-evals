// Detect direct MP4 navigation
if (window.location.pathname.endsWith('.mp4')) {
  const videoUrl = window.location.href;
  const viewerUrl = chrome.runtime.getURL('index.html') + '?src=' + encodeURIComponent(videoUrl);
  window.location.replace(viewerUrl);
}
