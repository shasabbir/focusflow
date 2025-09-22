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
const contributionStats = document.getElementById('contributionStats');

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
  const totalMinutes = values.reduce((sum, val) => sum + val, 0);
  
  // Calculate week stats
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  let thisWeekMinutes = 0;
  
  // Create weeks structure
  for (let week = 0; week < 13; week++) {
    const weekElement = document.createElement('div');
    weekElement.className = 'contribution-week';
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (week * 7) + day);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayElement = document.createElement('div');
      dayElement.className = 'contribution-day';
      
      const value = data[dateStr] || 0;
      if (value > 0) {
        const level = Math.ceil((value / maxValue) * 4);
        dayElement.classList.add(`level-${Math.min(level, 4)}`);
      }
      
      // Check if this day is in current week
      if (date >= thisWeekStart && date <= today) {
        thisWeekMinutes += value;
      }
      
      // Add tooltip and hover effects
      dayElement.addEventListener('mouseenter', (e) => {
        showTooltip(e, dateStr, value, date);
        dayElement.style.transform = 'scale(1.2)';
        dayElement.style.zIndex = '10';
      });
      
      dayElement.addEventListener('mouseleave', (e) => {
        hideTooltip();
        dayElement.style.transform = '';
        dayElement.style.zIndex = '';
      });
      
      // Add click animation
      dayElement.addEventListener('click', (e) => {
        dayElement.style.animation = 'pulse 0.3s ease-in-out';
        setTimeout(() => {
          dayElement.style.animation = '';
        }, 300);
      });
      
      weekElement.appendChild(dayElement);
    }
    
    contributionGrid.appendChild(weekElement);
  }
  
  // Update stats
  updateContributionStats(thisWeekMinutes, totalMinutes);
}

// Show tooltip for contribution day
function showTooltip(event, dateStr, value, date) {
  const tooltip = document.getElementById('contributionTooltip');
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  let message;
  if (value === 0) {
    message = `No focus time on ${dayName}, ${monthDay}`;
  } else if (value < 60) {
    message = `${value} minutes on ${dayName}, ${monthDay}`;
  } else {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    message = `${hours}h ${minutes}m on ${dayName}, ${monthDay}`;
  }
  
  tooltip.textContent = message;
  tooltip.classList.add('show');
  
  // Position tooltip with boundary detection
  const rect = event.target.getBoundingClientRect();
  const popupRect = document.querySelector('.container').getBoundingClientRect();
  
  // Set initial position
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 10}px`;
  
  // Wait for tooltip to render to get its dimensions
  requestAnimationFrame(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Check if tooltip goes outside popup boundaries
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;
    
    // Adjust horizontal position if going outside
    if (left < popupRect.left + 10) {
      left = popupRect.left + 10;
    } else if (left + tooltipRect.width > popupRect.right - 10) {
      left = popupRect.right - tooltipRect.width - 10;
    }
    
    // Adjust vertical position if going outside top
    if (top < popupRect.top + 10) {
      top = rect.bottom + 10;
      // Flip arrow direction when tooltip is below
      tooltip.classList.add('arrow-up');
    } else {
      tooltip.classList.remove('arrow-up');
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });
}

// Hide tooltip
function hideTooltip() {
  const tooltip = document.getElementById('contributionTooltip');
  tooltip.classList.remove('show', 'arrow-up');
}

// Update contribution statistics
function updateContributionStats(thisWeekMinutes, totalMinutes) {
  const statsElement = document.getElementById('contributionStats');
  
  if (thisWeekMinutes === 0) {
    statsElement.textContent = 'No focus time this week';
  } else if (thisWeekMinutes < 60) {
    statsElement.textContent = `${thisWeekMinutes} minutes this week`;
  } else {
    const hours = Math.floor(thisWeekMinutes / 60);
    const minutes = thisWeekMinutes % 60;
    if (minutes === 0) {
      statsElement.textContent = `${hours}h this week`;
    } else {
      statsElement.textContent = `${hours}h ${minutes}m this week`;
    }
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
