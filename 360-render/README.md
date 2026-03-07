# 360 Video Player Chrome Extension

A powerful Chrome extension for viewing equirectangular (360°) videos from Azure Blob Storage with interactive panoramic rendering.

## 🎯 Features

✅ **Direct Azure Support** - Fetch videos from Azure CDN with SAS tokens
✅ **360° Panorama Rendering** - View equirectangular videos in immersive 360° panorama
✅ **Optimized Blob Handling** - Uses XMLHttpRequest + Fetch with fallbacks for maximum compatibility
✅ **Caching** - Caches downloaded blobs to speed up repeated playback
✅ **Click & Drag Controls** - Mouse drag to look around
✅ **Touch Support** - Swipe on mobile/tablet
✅ **Fullscreen Mode** - Immersive fullscreen viewing
✅ **Automatic Injection** - Detects video links in pages and injects 360 player buttons

## 📋 What's Included

```
chrome_360_extension/
├── manifest.json          # Extension configuration
├── background.js          # Background worker for video fetching
├── content.js             # Page content script for injecting buttons
├── player.html            # 360° viewer with Three.js rendering
├── popup.html             # Extension popup UI
├── popup.js               # Popup controls
└── test.html              # Testing page for Azure URLs
```

## 🚀 Installation

### Manual Installation (Chrome)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome_360_extension` folder
5. The extension is now ready to use!

### Verifying Installation

- You should see the extension icon in your toolbar
- On pages with videos, a blue "360 View" button will appear next to video links

## 📝 How to Use

### Option 1: Direct URL Input (Easiest)

1. Open `test.html` in your browser (or visit it through the extension)
2. Paste your Azure SAS URL
3. Click "▶ Open in 360 Viewer"
4. Use mouse to look around (click + drag)

### Option 2: From Any Webpage

1. Navigate to a page with an Azure video link
2. Look for the blue "360 View" button next to the video link
3. Click it to open the 360 player in a new tab

### Option 3: Extension Popup

1. Click the extension icon
2. Paste a video URL in the input field
3. Click "Open in 360 Player"

## 🎮 Controls

### Mouse
- **Click + Drag** - Look around (rotation)
- **Scroll** - Zoom in/out

### Touch (Mobile/Tablet)
- **Swipe** - Look around  
- **Pinch** - Zoom in/out

### Keyboard/Buttons
- **▶ Play** - Play/pause video
- **⛶ Fullscreen** - Enter fullscreen mode
- **↻ Reset View** - Reset to default viewing angle

## 🔧 Technical Details

### How It Works

1. **Background Worker** (`background.js`)
   - Intercepts fetch requests to Azure blob storage
   - Uses XMLHttpRequest for maximum CORS compatibility
   - Falls back to Fetch API if XHR fails
   - Caches blob URLs for performance

2. **Video Rendering** (`player.html`)
   - Uses Three.js for 360° sphere rendering
   - Applies video as texture to sphere
   - Renders from inside sphere for panoramic view
   - Sends message to background worker to fetch video blob

3. **Content Injection** (`content.js`)
   - Scans pages for video links
   - Injects "360 View" buttons next to Azure video URLs
   - Handles page interactions

### CORS Handling

The extension uses multiple strategies to handle CORS restrictions:

1. **XMLHttpRequest** (Primary)
   - Direct XHR with proper headers
   - Best for Azure blob storage

2. **Fetch API** (Fallback)
   - Modern fetch with CORS mode
   - Used if XHR fails

3. **Direct Load** (Last Resort)
   - Browser loads video directly
   - Useful when other methods fail

## 🐛 Troubleshooting

### "No response from background worker"
- Reload the extension: `chrome://extensions/` → Find extension → Click reload icon
- Check console for errors: Right-click → Inspect → Console tab

### Video won't load
- Verify URL is valid and SAS token hasn't expired
- Check `?se=` parameter in URL (expiration date)
- Try opening URL directly in browser
- Use the Python downloader script as alternative

### CORS errors
- These are normal alerts from browser security
- The extension automatically falls back to alternative methods
- Try reloading the page or extension

### Extension not appearing on pages
- Ensure extension is enabled in `chrome://extensions/`
- Reload the webpage (F5 or Cmd+R)
- Check that the page contains video links

## 📊 Debugging

### View Extension Logs

1. Right-click the extension icon
2. Select "Inspect"
3. Open "Console" tab
4. Look for messages starting with "Background:" or "Player:"

### Example Debug Output
```
Background: Fetching video from: https://featherstorageprod-...
Background: XHR success, blob size: 8720384
Background: Cached blob URL for future use
✅ Video loaded via xhr!
8.3 MB
Rendering...
```

## 🔐 Security & Privacy

- ✅ No data collection
- ✅ All processing happens locally
- ✅ Video data only used for rendering
- ✅ Cache stored in memory (cleared on browser restart)
- ✅ Extension permissions limited to necessary scopes

## 📦 Alternative: Python Downloader

For when the extension isn't available:

```bash
python3 download_azure_video.py "https://your-azure-url.mp4?..."
```

This downloads the video to `~/Downloads/360_videos/` which you can then view with the extension.

## 🤝 Support

### Common Issues

**Extension won't load unpacked**
- Verify you're in Developer mode
- Check that manifest.json is valid JSON
- Try restarting Chrome

**Video plays but doesn't look right**
- Ensure video is equirectangular format (360°)
- Try resetting view with "↻ Reset View" button
- Check if video dimensions are correct

**Performance issues on large videos**
- Close other browser tabs
- Try fullscreen mode for better rendering
- Use a newer GPU if available

## 📝 Version History

- **v1.0** - Initial release with XHR/Fetch/Direct load fallbacks
  - Azure blob storage support
  - 360° panorama rendering
  - Multi-method video fetching
  - Caching for performance

## 🎓 Learn More

- [Three.js Documentation](https://threejs.org/docs/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Azure Blob Storage SAS](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)

---

**Happy 360° viewing! 🎬**
