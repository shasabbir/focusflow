// Popup script for FocusFlow extension
// Firefox compatibility
if (typeof browser === 'undefined') {
  var browser = chrome;
}

let timerState = {
  timeLeft: 25 * 60,
  mode: 'focus',
  isActive: false,
  focusCycle: 0,
  settings: { focus: 25, shortBreak: 5, longBreak: 15 }
};

// DOM elements
const timeDisplay = document.getElementById('timeDisplay');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const playPauseText = document.getElementById('playPauseText');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const cycleStatus = document.getElementById('cycleStatus');
const modeTabs = document.querySelectorAll('.mode-tab');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const focusInput = document.getElementById('focusInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const contributionGrid = document.getElementById('contributionGrid');

// Format time display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update UI based on timer state
function updateUI() {
  timeDisplay.textContent = formatTime(timerState.timeLeft);
  
  // Update play/pause button
  if (timerState.isActive) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playPauseText.textContent = 'Pause';
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playPauseText.textContent = 'Start';
  }
  
  // Update mode tabs
  modeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === timerState.mode);
  });
  
  // Update cycle status
  cycleStatus.textContent = `Completed focus sessions in this cycle: ${timerState.focusCycle % 4}`;
  
  // Update settings inputs
  focusInput.value = timerState.settings.focus;
  shortBreakInput.value = timerState.settings.shortBreak;
  longBreakInput.value = timerState.settings.longBreak;
}

// Send message to background script
function sendMessage(type, data = {}) {
  return browser.runtime.sendMessage({ type, ...data });
}

// Load initial timer state
async function loadTimerState() {
  try {
    const response = await sendMessage('getTimerState');
    timerState = response;
    updateUI();
    loadContributionData();
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
}

// Load contribution data
async function loadContributionData() {
  try {
    const response = await sendMessage('getContributionData');
    const data = response.data || {};
    renderContributionGraph(data);
  } catch (error) {
    console.error('Error loading contribution data:', error);
  }
}

// Render contribution graph
function renderContributionGraph(data) {
  contributionGrid.innerHTML = '';
  
  // Generate last 91 days (13 weeks)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 90);
  
  // Get max value for scaling
  const values = Object.values(data);
  const maxValue = Math.max(...values, 1);
  
  for (let i = 0; i < 91; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayElement = document.createElement('div');
    dayElement.className = 'contribution-day';
    
    const value = data[dateStr] || 0;
    if (value > 0) {
      const level = Math.ceil((value / maxValue) * 4);
      dayElement.classList.add(`level-${Math.min(level, 4)}`);
    }
    
    dayElement.title = `${dateStr}: ${value} minutes`;
    contributionGrid.appendChild(dayElement);
  }
}

// Event listeners
playPauseBtn.addEventListener('click', async () => {
  if (timerState.isActive) {
    await sendMessage('pauseTimer');
  } else {
    await sendMessage('startTimer');
  }
});

resetBtn.addEventListener('click', async () => {
  await sendMessage('resetTimer');
});

skipBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to skip to the next session?')) {
    await sendMessage('skipToNext');
  }
});

modeTabs.forEach(tab => {
  tab.addEventListener('click', async () => {
    await sendMessage('setMode', { mode: tab.dataset.mode });
  });
});

settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'block';
});

cancelSettings.addEventListener('click', () => {
  settingsModal.style.display = 'none';
  updateUI(); // Reset settings inputs
});

saveSettings.addEventListener('click', async () => {
  const newSettings = {
    focus: parseInt(focusInput.value),
    shortBreak: parseInt(shortBreakInput.value),
    longBreak: parseInt(longBreakInput.value)
  };
  
  await sendMessage('updateSettings', { settings: newSettings });
  settingsModal.style.display = 'none';
});

// Close settings modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
    updateUI();
  }
});

// Listen for timer updates from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'timerUpdate') {
    timerState = message.data;
    updateUI();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    playPauseBtn.click();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    resetBtn.click();
  } else if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    skipBtn.click();
  }
});

// Update UI every second when popup is open
setInterval(() => {
  if (timerState.isActive) {
    loadTimerState();
  }
}, 1000);

// Initialize popup
loadTimerState();
