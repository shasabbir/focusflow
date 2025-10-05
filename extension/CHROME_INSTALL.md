# FocusFlow Chrome Extension Installation Guide

## How to Install the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/` or click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle on "Developer mode" in the top right corner of the extensions page

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `extension` folder from this project
   - The FocusFlow extension should now appear in your extensions list

4. **Pin the Extension** (Optional but recommended)
   - Click the puzzle piece icon in Chrome's toolbar
   - Click the pin icon next to FocusFlow to pin it to your toolbar

## Features

- **Pomodoro Timer**: 25-minute focus sessions with 5-minute short breaks and 15-minute long breaks
- **Contribution Graph**: Visual representation of your focus time similar to GitHub's contribution graph
- **Settings**: Customize focus and break durations
- **Notifications**: Get notified when sessions end
- **Keyboard Shortcuts**: 
  - Spacebar: Start/Pause timer
  - R: Reset timer
  - S: Skip to next session

## Extension Structure

- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Service worker handling timer logic and data sync
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality and UI interactions
- `icons/` - Extension icons in various sizes

## Troubleshooting

If you encounter issues:

1. **Extension not loading**: Make sure you selected the correct folder containing `manifest.json`
2. **Timer not working**: Check the browser console for errors (F12 → Console)
3. **Data not syncing**: Ensure you have an internet connection for backend sync
4. **Notifications not showing**: Check Chrome notification permissions
5. **Icons not showing**: The extension now includes proper PNG icons. If you still see issues, try:
   - Reload the extension in chrome://extensions/
   - Remove and re-add the extension
   - Clear Chrome's extension cache

## Differences from Firefox Version

This version has been updated to work with Chrome's Manifest V3:
- Updated from `browser` API to `chrome` API
- Changed from background scripts to service worker
- Updated from `browser_action` to `action`
- Moved host permissions out of permissions array

## Support

For issues or feature requests, please check the main project documentation.
