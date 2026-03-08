// Helper to check if the page is a raw video player
function isRawVideoPage() {
  // 1. Check URL extension
  const isVideoUrl = /\.(mp4|webm|mkv|mov)($|\?)/i.test(window.location.href);
  
  // 2. Check if Chrome has generated a video player DOM
  // Chrome wraps raw videos in a <video> tag centered in the body
  const videoElements = document.querySelectorAll('video');
  const isChromeVideoPlayer = videoElements.length === 1 && 
                              document.body.childNodes.length <= 5 && // Usually just video + shadow root or simple structure
                              (document.body.style.backgroundColor === 'rgb(0, 0, 0)' || document.body.style.backgroundColor === 'black');

  return isVideoUrl || isChromeVideoPlayer;
}

if (isRawVideoPage()) {
  console.log("Prism 360: Video detected, redirecting to viewer...");
  const videoUrl = window.location.href;
  const viewerUrl = chrome.runtime.getURL('index.html') + '?src=' + encodeURIComponent(videoUrl);
  window.location.replace(viewerUrl);
}
