# FocusFlow Firefox Extension

A Pomodoro timer extension for Firefox that displays the current timer in the browser toolbar badge.

## Features

- ⏱️ **Timer in Badge**: Current countdown displayed in the browser toolbar
- 🍅 **Pomodoro Technique**: 25-minute focus sessions with breaks
- 🔄 **Auto Cycling**: Automatically switches between focus and break modes
- 📊 **Progress Tracking**: Visual contribution graph showing daily focus time
- 🔔 **Notifications**: Browser notifications when sessions complete
- ⚙️ **Customizable**: Adjust focus and break durations
- 🎨 **Dark Mode**: Supports light and dark themes
- ⌨️ **Keyboard Shortcuts**: Space to play/pause, R to reset, S to skip

## Installation

### For Development/Testing

1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Navigate to the `extension` folder and select `manifest.json`

### For Distribution

1. Install [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool:
   ```bash
   npm install -g web-ext
   ```

2. Build the extension:
   ```bash
   cd extension
   web-ext build
   ```

3. The `.zip` file will be created in `web-ext-artifacts/`

## Usage

1. Click the FocusFlow icon in the toolbar to open the popup
2. Select your mode: Focus, Break, or Long Break
3. Click "Start" to begin the timer
4. The countdown will appear in the toolbar badge
5. Receive notifications when sessions complete
6. Track your progress with the contribution graph

## Timer Modes

- **Focus**: 25 minutes (default) - For concentrated work
- **Short Break**: 5 minutes (default) - Quick break after focus sessions
- **Long Break**: 15 minutes (default) - Longer break after 4 focus sessions

## Keyboard Shortcuts

When the popup is open:
- `Space`: Start/Pause timer
- `R`: Reset current timer
- `S`: Skip to next session

## Settings

Click the gear icon to customize:
- Focus session duration
- Short break duration  
- Long break duration

## Data Storage

The extension stores:
- Timer settings in browser local storage
- Daily focus session history for the contribution graph
- Current session state (survives browser restarts)

## Browser Compatibility

- Firefox 57+ (WebExtensions API)
- Manifest V2 compatible

## Privacy

This extension:
- ✅ Works completely offline
- ✅ Stores data locally only
- ✅ No external servers or tracking
- ✅ No personal data collection

## Technical Details

- **Manifest Version**: 2 (Firefox compatible)
- **Storage**: browser.storage.local API
- **Notifications**: browser.notifications API
- **Badge**: browser.browserAction API
- **Architecture**: Background script + Popup interface

## Contributing

To modify the extension:

1. Edit files in the `extension/` directory
2. Reload the extension in `about:debugging`
3. Test changes in the popup and background behavior

### File Structure

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Timer logic and badge updates
├── popup.html            # Popup interface
├── popup.js              # Popup interactions
├── icons/                # Extension icons
└── generate-icons.js     # Icon generation script
```

## Original Project

This extension is based on the FocusFlow Next.js web application. The core timer logic and UI design have been adapted for the browser extension environment.
