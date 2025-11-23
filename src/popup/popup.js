import { logMessage } from '../utils.js';

const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontColorInput = document.getElementById('fontColor');
const fontColorValue = document.getElementById('fontColorValue');
const annotateBtn = document.getElementById('annotateBtn');
const clearBtn = document.getElementById('clearBtn');
const autoRunToggle = document.getElementById('autoRunToggle');
const maskModeToggle = document.getElementById('maskModeToggle');
const ttsModeToggle = document.getElementById('ttsModeToggle');

// Load settings
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    const hostname = new URL(tabs[0].url).hostname;
    chrome.storage.local.get([`autoRun_${hostname}`, 'defaultSettings'], (result) => {
      // Auto-run toggle
      if (result[`autoRun_${hostname}`]) {
        autoRunToggle.checked = true;
      }

      // Restore saved settings or default to Red
      const settings = result.defaultSettings || { fontSize: '12px', color: '#ff0000', maskMode: false, ttsMode: false };

      if (settings.fontSize) {
        const sizeNum = parseInt(settings.fontSize);
        if (!isNaN(sizeNum)) {
          fontSizeInput.value = sizeNum;
          fontSizeValue.textContent = settings.fontSize;
        }
      }

      if (settings.color) {
        fontColorInput.value = settings.color;
        fontColorValue.textContent = settings.color;
      }

      if (settings.maskMode) maskModeToggle.checked = true;
      if (settings.ttsMode) ttsModeToggle.checked = true;
    });
  }
});

function saveSettings() {
  const settings = {
    fontSize: fontSizeInput.value + 'px',
    color: fontColorInput.value,
    maskMode: maskModeToggle.checked,
    ttsMode: ttsModeToggle.checked
  };
  chrome.storage.local.set({ defaultSettings: settings });
}

// Update labels on input change
fontSizeInput.addEventListener('input', (e) => {
  fontSizeValue.textContent = `${e.target.value}px`;
  saveSettings();
});

fontColorInput.addEventListener('input', (e) => {
  fontColorValue.textContent = e.target.value;
  saveSettings();
});

maskModeToggle.addEventListener('change', saveSettings);
ttsModeToggle.addEventListener('change', saveSettings);

// Auto-run Toggle
autoRunToggle.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const hostname = new URL(tabs[0].url).hostname;
      const key = `autoRun_${hostname}`;
      const data = {};
      data[key] = isChecked;
      chrome.storage.local.set(data, () => {
        logMessage(`Auto-run for ${hostname} set to ${isChecked}`);
      });
    }
  });
});

// Annotate Button
annotateBtn.addEventListener('click', () => {
  const settings = {
    fontSize: fontSizeInput.value + 'px',
    color: fontColorInput.value,
    maskMode: maskModeToggle.checked,
    ttsMode: ttsModeToggle.checked
  };

  // Also save settings when clicking annotate, just in case
  saveSettings();

  logMessage('Annotate clicked with settings: ' + JSON.stringify(settings));

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'annotate',
        settings: settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          logMessage('Error: ' + chrome.runtime.lastError.message);
        } else {
          logMessage('Message response: ' + (response?.status || 'no response'));
        }
      });
    }
  });
});

// Clear Button
clearBtn.addEventListener('click', () => {
  logMessage('Clear clicked');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'clear' }, (response) => {
        if (chrome.runtime.lastError) {
          logMessage('Error: ' + chrome.runtime.lastError.message);
        } else {
          logMessage('Message response: ' + (response?.status || 'no response'));
        }
      });
    }
  });
});