if (document.querySelector("video")) {
  const videoSrc = window.location.href;

  const viewerUrl = chrome.runtime.getURL("viewer.html") + 
                    "?src=" + encodeURIComponent(videoSrc);

  window.location.replace(viewerUrl);
}