# 🚀 FocusFlow Extension Installation & Troubleshooting

## Quick Installation Steps

### 1. Load Extension in Firefox

1. Open Firefox
2. Type `about:debugging` in the address bar
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to `d:\focusflow\extension\`
6. Select `manifest.json`
7. Click "Open"

### 2. Verify Installation

You should see:
- ✅ FocusFlow icon in your Firefox toolbar
- ✅ Extension listed in the debugging page
- ✅ Badge showing "25:00" on the toolbar icon

## 🔧 Common Issues & Fixes

### Issue 1: Badge Not Updating

**Symptoms**: Timer icon doesn't show countdown time

**Solutions**:
1. **Check Background Script**:
   - In `about:debugging`, click "Inspect" next to FocusFlow
   - Look for errors in console
   - Refresh the extension if needed

2. **Verify Permissions**:
   - Extension should have storage and notifications permissions
   - Check manifest.json for correct permissions

3. **Test Manually**:
   ```javascript
   // Run in extension console (about:debugging > Inspect)
   browser.browserAction.setBadgeText({ text: "TEST" });
   ```

### Issue 2: API Not Working

**Symptoms**: Settings don't sync, contribution data not saved

**Solutions**:
1. **Check Network Tab**:
   - Open Browser Developer Tools (F12)
   - Go to Network tab
   - Start timer and look for requests to `script.google.com`

2. **Test API Manually**:
   ```javascript
   // Run in browser console
   fetch('https://script.google.com/macros/s/AKfycbxRLznvfGO_bMX1sMymAbS96Mye-Qd2j7QiBf7CcOGK-tE1M7L7qN4iYXpDks02l-NqlA/exec?action=getAllDurations')
     .then(r => r.json())
     .then(console.log);
   ```

3. **Check CORS Issues**:
   - The Google Apps Script URL must allow cross-origin requests
   - Verify the script is published and accessible

### Issue 3: Extension Won't Load

**Symptoms**: Error when loading manifest.json

**Solutions**:
1. **Check File Structure**:
   ```
   extension/
   ├── manifest.json
   ├── background.js
   ├── popup.html
   ├── popup.js
   └── icons/
       ├── icon-16.png
       ├── icon-32.png
       ├── icon-48.png
       └── icon-128.png
   ```

2. **Validate Manifest**:
   - Use [WebExtension Validator](https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#validation)
   - Check JSON syntax

3. **Check Icon Files**:
   - All icon files must exist
   - Use temporary files if needed:
     ```powershell
     cd extension\icons
     copy ..\..\public\favicon.ico icon-16.png
     copy ..\..\public\favicon.ico icon-32.png
     copy ..\..\public\favicon.ico icon-48.png
     copy ..\..\public\favicon.ico icon-128.png
     ```

### Issue 4: Timer Doesn't Start

**Symptoms**: Clicking start button does nothing

**Solutions**:
1. **Check Popup Console**:
   - Right-click on extension popup
   - Select "Inspect Element"
   - Look for JavaScript errors

2. **Test Message Passing**:
   ```javascript
   // Run in popup console
   browser.runtime.sendMessage({type: 'getTimerState'})
     .then(console.log);
   ```

3. **Restart Extension**:
   - Go to `about:debugging`
   - Click "Remove" next to FocusFlow
   - Reload the extension

## 🧪 Testing the Extension

Run the test script to verify all functionality:

1. Install the extension
2. Open browser console (F12)
3. Copy and paste the content of `test-extension.js`
4. Look for ✓ (success) or ✗ (failure) messages

## 🔄 Reloading After Changes

When you modify the extension files:

1. Go to `about:debugging`
2. Find FocusFlow extension
3. Click "Reload" button
4. The extension will restart with new code

## 📊 Monitoring Extension Activity

### Background Script Console
- `about:debugging` > Click "Inspect" next to FocusFlow
- Shows timer logic and API calls

### Popup Console  
- Right-click popup > "Inspect Element"
- Shows UI interactions and state updates

### Browser Console
- F12 > Console tab
- Shows extension messages and API responses

## 🆘 Still Having Issues?

1. **Check Firefox Version**: Requires Firefox 57+
2. **Disable Other Extensions**: Test with minimal setup
3. **Clear Extension Data**:
   ```javascript
   browser.storage.local.clear();
   ```
4. **Check Browser Console**: Look for any error messages
5. **Verify Internet Connection**: Required for API sync

## 🎯 Expected Behavior

When working correctly:
- ✅ Badge shows current timer (e.g., "24:59", "04:30")
- ✅ Badge color changes: Red (Focus), Green (Break), Blue (Long Break)
- ✅ Notifications appear when sessions complete
- ✅ Settings persist between browser sessions
- ✅ Contribution graph shows daily progress
- ✅ Timer continues in background when popup is closed
