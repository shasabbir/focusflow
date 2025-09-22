// Test script for FocusFlow extension
// Run this in the browser console after installing the extension

console.log('Testing FocusFlow Extension...');

// Test 1: Check if extension is loaded
browser.runtime.getManifest().then(manifest => {
  console.log('✓ Extension loaded:', manifest.name, manifest.version);
}).catch(err => {
  console.error('✗ Extension not loaded:', err);
});

// Test 2: Check badge functionality
browser.browserAction.setBadgeText({ text: 'TEST' }).then(() => {
  console.log('✓ Badge API working');
  // Reset badge after test
  setTimeout(() => {
    browser.browserAction.setBadgeText({ text: '' });
  }, 2000);
}).catch(err => {
  console.error('✗ Badge API failed:', err);
});

// Test 3: Check storage API
browser.storage.local.set({ test: 'value' }).then(() => {
  return browser.storage.local.get(['test']);
}).then(result => {
  if (result.test === 'value') {
    console.log('✓ Storage API working');
    // Clean up
    browser.storage.local.remove(['test']);
  } else {
    console.log('✗ Storage API not working properly');
  }
}).catch(err => {
  console.error('✗ Storage API failed:', err);
});

// Test 4: Check notifications API
browser.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon-48.png',
  title: 'FocusFlow Test',
  message: 'Extension is working!'
}).then(() => {
  console.log('✓ Notifications API working');
}).catch(err => {
  console.error('✗ Notifications API failed:', err);
});

// Test 5: Test API connectivity
fetch('https://script.google.com/macros/s/AKfycbxRLznvfGO_bMX1sMymAbS96Mye-Qd2j7QiBf7CcOGK-tE1M7L7qN4iYXpDks02l-NqlA/exec?action=getAllDurations')
  .then(response => {
    if (response.ok) {
      console.log('✓ Google Apps Script API accessible');
      return response.json();
    } else {
      throw new Error('API response not OK');
    }
  })
  .then(data => {
    console.log('✓ API data received:', data);
  })
  .catch(err => {
    console.error('✗ API connectivity failed:', err);
  });

console.log('Extension test completed. Check console for results.');
