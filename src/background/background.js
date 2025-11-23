import { logMessage } from '../utils.js';

chrome.runtime.onInstalled.addListener(() => {
  logMessage('Extension installed!');
});