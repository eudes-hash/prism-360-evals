// Background worker for extension
// Global cache for downloaded videos
const videoCache = {};

// Listen for requests to open the 360 player
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPlayer') {
    const playerUrl = chrome.runtime.getURL('player.html') + '?src=' + encodeURIComponent(message.url);
    chrome.tabs.create({ url: playerUrl }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }
  
  // Handle video fetch with caching
  if (message.action === 'fetchVideo') {
    fetchVideoWithHeaders(message.url, sendResponse);
    return true;
  }
});

async function fetchVideoWithHeaders(videoUrl, sendResponse) {
  try {
    console.log('Background: Fetching video from:', videoUrl.substring(0, 80));
    
    // Check cache first
    if (videoCache[videoUrl]) {
      console.log('Background: Using cached blob URL');
      sendResponse({
        success: true,
        blobUrl: videoCache[videoUrl],
        cached: true
      });
      return;
    }
    
    // Try XMLHttpRequest for better CORS handling
    const xhr = new XMLHttpRequest();
    xhr.open('GET', videoUrl, true);
    xhr.responseType = 'blob';
    
    xhr.setRequestHeader('Accept', 'video/*');
    xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    xhr.onload = () => {
      if (xhr.status === 200 && xhr.response) {
        console.log('Background: XHR success, blob size:', xhr.response.size);
        
        // Create and cache blob URL
        const blobUrl = URL.createObjectURL(xhr.response);
        videoCache[videoUrl] = blobUrl;
        
        console.log('Background: Cached blob URL for future use');
        
        sendResponse({
          success: true,
          blobUrl: blobUrl,
          size: xhr.response.size,
          type: xhr.response.type,
          method: 'xhr'
        });
      } else {
        throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
      }
    };
    
    xhr.onerror = () => {
      console.error('Background: XHR error, trying fetch...');
      fetchAsLastResort(videoUrl, sendResponse);
    };
    
    xhr.ontimeout = () => {
      console.error('Background: XHR timeout');
      sendResponse({
        success: false,
        error: 'Request timeout',
        method: 'xhr'
      });
    };
    
    xhr.timeout = 30000;
    xhr.send();
    
  } catch (error) {
    console.error('Background: Error in fetchVideoWithHeaders:', error);
    fetchAsLastResort(videoUrl, sendResponse);
  }
}

async function fetchAsLastResort(videoUrl, sendResponse) {
  try {
    console.log('Background: Attempting fetch as fallback...');
    
    const response = await fetch(videoUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    console.log('Background: Fetch succeeded, blob size:', blob.size);
    
    const blobUrl = URL.createObjectURL(blob);
    videoCache[videoUrl] = blobUrl;
    
    sendResponse({
      success: true,
      blobUrl: blobUrl,
      size: blob.size,
      method: 'fetch'
    });
    
  } catch (error) {
    console.error('Background: All fetch methods failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function handleVideoDownload(videoUrl, sendResponse) {
  try {
    console.log('Background: Downloading video from:', videoUrl);
    
    // Use chrome.downloads.download API for direct downloading
    const filename = `video_${Date.now()}.mp4`;
    
    chrome.downloads.download({
      url: videoUrl,
      filename: filename
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        console.log('Download started with ID:', downloadId);
        sendResponse({
          success: true,
          downloadId: downloadId,
          filename: filename
        });
      }
    });

  } catch (error) {
    console.error('Background: Download error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}


