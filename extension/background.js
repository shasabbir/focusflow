// Background script for FocusFlow extension (Chrome Manifest V3)
// Use chrome API directly for Chrome extensions

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxRLznvfGO_bMX1sMymAbS96Mye-Qd2j7QiBf7CcOGK-tE1M7L7qN4iYXpDks02l-NqlA/exec';

let timer = {
  timeLeft: 25 * 60, // 25 minutes in seconds
  mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
  isActive: false,
  focusCycle: 0,
  settings: {
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  }
};

let timerInterval = null;
let syncInterval = null;

// Keep service worker alive during timer operation
let keepAliveInterval = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  loadSettings();
  updateBadge();
  startBackgroundSync();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  loadSettings();
  updateBadge();
  startBackgroundSync();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['pomodoroSettings', 'pomodoroCycle']);
    if (result.pomodoroSettings) {
      timer.settings = result.pomodoroSettings;
    }
    if (result.pomodoroCycle) {
      timer.focusCycle = result.pomodoroCycle;
    }
    resetTimer();
    
    // Sync with backend after loading local data
    syncWithBackend();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Sync data with the backend
async function syncWithBackend() {
  try {
    console.log('Syncing with backend API...');
    const [settingsResponse, historyResponse] = await Promise.all([
      fetch(`${APPS_SCRIPT_URL}?action=getAllDurations`),
      fetch(`${APPS_SCRIPT_URL}?action=getHistory`)
    ]);

    if (settingsResponse.ok) {
      const remoteSettings = await settingsResponse.json();
      const newSettings = {
        focus: remoteSettings.focus / 60,
        shortBreak: remoteSettings.break / 60,
        longBreak: remoteSettings.longBreak / 60,
      };
      timer.settings = newSettings;
      await chrome.storage.local.set({ pomodoroSettings: newSettings });
      resetTimer();
      
      // Notify popup of settings update
      notifyPopup();
    } else {
      console.error("Failed to fetch settings, using local/default.");
    }
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      await chrome.storage.local.set({ pomodoroHistory: historyData });
      
      // Notify popup that contribution data has been updated
      chrome.runtime.sendMessage({
        type: 'contributionUpdate'
      }).catch(() => {
        // Popup might not be open, ignore error
      });
    } else {
      console.error("Failed to fetch contribution history.");
    }
    
    console.log('Background sync completed successfully');
  } catch (error) {
    console.error('Failed to sync data with backend', error);
  }
}

// Start background sync when timer is not running
function startBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Sync every minute when timer is not active
  syncInterval = setInterval(() => {
    if (!timer.isActive) {
      console.log('Background sync: Fetching latest data from API...');
      syncWithBackend();
    }
  }, 60000); // 60 seconds = 1 minute
}

// Stop background sync
function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.local.set({
      pomodoroSettings: timer.settings,
      pomodoroCycle: timer.focusCycle
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Format time for display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format time for badge (minutes only)
function formatTimeBadge(seconds) {
  const mins = Math.floor(seconds / 60);
  return mins.toString();
}

// Update badge with current time
function updateBadge() {
  const timeText = formatTimeBadge(timer.timeLeft);
  chrome.action.setBadgeText({ text: timeText });
  
  // Set badge color based on mode
  let color;
  switch (timer.mode) {
    case 'focus':
      color = '#dc2626'; // red
      break;
    case 'shortBreak':
      color = '#059669'; // green
      break;
    case 'longBreak':
      color = '#0284c7'; // blue
      break;
    default:
      color = '#6b7280'; // gray
  }
  chrome.action.setBadgeBackgroundColor({ color });
  
  // Update title with current status
  const status = timer.isActive ? 'Running' : 'Paused';
  const modeText = timer.mode === 'shortBreak' ? 'Short Break' : 
                   timer.mode === 'longBreak' ? 'Long Break' : 'Focus';
  const fullTimeText = formatTime(timer.timeLeft);
  chrome.action.setTitle({ 
    title: `${modeText} (${status}): ${fullTimeText}` 
  });
}

// Start timer
function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timer.isActive = true;
  // Stop background sync while timer is running
  stopBackgroundSync();
  
  // Keep service worker alive during timer
  startKeepAlive();
  
  timerInterval = setInterval(() => {
    timer.timeLeft--;
    updateBadge();
    
    if (timer.timeLeft <= 0) {
      handleTimerEnd();
    }
  }, 1000);
  
  updateBadge();
  notifyPopup();
}

// Pause timer
function pauseTimer() {
  timer.isActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Stop keeping service worker alive
  stopKeepAlive();
  
  // Restart background sync when timer is paused
  startBackgroundSync();
  
  updateBadge();
  notifyPopup();
}

// Reset timer
function resetTimer() {
  timer.isActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Stop keeping service worker alive
  stopKeepAlive();
  
  switch (timer.mode) {
    case 'focus':
      timer.timeLeft = timer.settings.focus * 60;
      break;
    case 'shortBreak':
      timer.timeLeft = timer.settings.shortBreak * 60;
      break;
    case 'longBreak':
      timer.timeLeft = timer.settings.longBreak * 60;
      break;
  }
  
  updateBadge();
  notifyPopup();
}

// Handle timer completion
function handleTimerEnd() {
  pauseTimer();
  
  if (timer.mode === 'focus') {
    timer.focusCycle++;
    saveSettings();
    saveContribution();
    
    // Notify popup that contribution data should be reloaded
    chrome.runtime.sendMessage({
      type: 'focusComplete',
      data: {
        timeLeft: timer.timeLeft,
        mode: timer.mode,
        isActive: timer.isActive,
        focusCycle: timer.focusCycle,
        settings: timer.settings
      }
    }).catch(() => {
      // Popup might not be open, ignore error
    });
    
    if (timer.focusCycle % 4 === 0) {
      timer.mode = 'longBreak';
      showNotification('Focus Complete!', `Time for a ${timer.settings.longBreak}-minute long break.`);
    } else {
      timer.mode = 'shortBreak';
      showNotification('Focus Complete!', `Time for a ${timer.settings.shortBreak}-minute short break.`);
    }
  } else {
    timer.mode = 'focus';
    showNotification("Break's Over!", "Time to get back to focus.");
  }
  
  resetTimer();
  
  // Restart background sync after timer ends
  startBackgroundSync();
}

// Save contribution data
async function saveContribution() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const focusDuration = timer.settings.focus;
  
  try {
    const result = await chrome.storage.local.get(['pomodoroHistory']);
    const history = result.pomodoroHistory || {};
    history[today] = (history[today] || 0) + focusDuration;
    await chrome.storage.local.set({ pomodoroHistory: history });
    
    // Sync with backend
    fetch(`${APPS_SCRIPT_URL}?action=incrementHistory&key=${today}&value=${focusDuration}`)
      .catch(error => console.error('Failed to save contribution to backend:', error));
    
  } catch (error) {
    console.error('Error saving contribution:', error);
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message
  });
}

// Skip to next session
function skipToNext() {
  handleTimerEnd();
}

// Set new mode
function setMode(newMode) {
  timer.mode = newMode;
  resetTimer();
}

// Update settings
function updateSettings(newSettings) {
  timer.settings = { ...timer.settings, ...newSettings };
  saveSettings();
  resetTimer();
  
  // Sync with backend
  const backendPromise = Promise.all([
    fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=focus&value=${newSettings.focus * 60}`),
    fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=break&value=${newSettings.shortBreak * 60}`),
    fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=longBreak&value=${newSettings.longBreak * 60}`),
  ]);

  backendPromise.catch(error => {
    console.error('Failed to save settings to backend', error);
  });
}

// Notify popup of state changes
function notifyPopup() {
  // Send message to popup if it's open
  chrome.runtime.sendMessage({
    type: 'timerUpdate',
    data: {
      timeLeft: timer.timeLeft,
      mode: timer.mode,
      isActive: timer.isActive,
      focusCycle: timer.focusCycle,
      settings: timer.settings
    }
  }).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'getTimerState':
      sendResponse({
        timeLeft: timer.timeLeft,
        mode: timer.mode,
        isActive: timer.isActive,
        focusCycle: timer.focusCycle,
        settings: timer.settings
      });
      break;
      
    case 'startTimer':
      startTimer();
      sendResponse({ success: true });
      break;
      
    case 'pauseTimer':
      pauseTimer();
      sendResponse({ success: true });
      break;
      
    case 'resetTimer':
      resetTimer();
      sendResponse({ success: true });
      break;
      
    case 'skipToNext':
      skipToNext();
      sendResponse({ success: true });
      break;
      
    case 'setMode':
      setMode(message.mode);
      sendResponse({ success: true });
      break;
      
    case 'updateSettings':
      updateSettings(message.settings);
      sendResponse({ success: true });
      break;
      
    case 'getContributionData':
      chrome.storage.local.get(['pomodoroHistory']).then(result => {
        sendResponse({ data: result.pomodoroHistory || {} });
      });
      return true; // Indicates we will send a response asynchronously
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Keep service worker alive during timer operation
function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  // Send a message to self every 20 seconds to keep service worker alive
  keepAliveInterval = setInterval(() => {
    chrome.runtime.sendMessage({ type: 'keepAlive' }).catch(() => {
      // Ignore errors - this is just to keep the service worker alive
    });
  }, 20000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Initialize on startup
loadSettings();
