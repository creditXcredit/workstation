/**
 * Workstation Chrome Extension - Content Script
 * Runs on all pages to enable action recording with Playwright auto-waiting
 */

// Import Playwright utilities (inline for content script)
import { PlaywrightAutoWait } from './playwright/auto-wait.js';
import { PlaywrightNetworkMonitor } from './playwright/network.js';

let isRecording = false;
let recordedActions = [];

// Initialize Playwright components
const networkMonitor = PlaywrightNetworkMonitor.getInstance();
networkMonitor.setupInterception();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    isRecording = true;
    recordedActions = [];
    console.log('⏺️ Recording started');
    sendResponse({ success: true });
  }
  
  if (request.action === 'stopRecording') {
    isRecording = false;
    console.log('⏹️ Recording stopped:', recordedActions);
    
    // Send recorded actions to background
    chrome.runtime.sendMessage({ 
      action: 'recordingComplete', 
      actions: recordedActions 
    });
    
    sendResponse({ success: true, count: recordedActions.length });
  }
  
  return true;
});

// Capture user interactions when recording with Playwright selector strategies
document.addEventListener('click', async (e) => {
  if (isRecording) {
    const element = e.target;
    
    // Get multiple selector strategies for robustness
    const strategies = PlaywrightAutoWait.getSelectorStrategies(element);
    const selector = strategies[0]; // Primary strategy
    
    const actionData = {
      agent_type: 'browser',
      action: 'click',
      parameters: { 
        selector,
        alternativeSelectors: strategies.slice(1), // Fallback strategies
        text: element.textContent?.trim().substring(0, 50) || ''
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    // Send to background immediately
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    // Visual feedback
    highlightElement(element);
    
    console.log('🎯 Recorded click with strategies:', strategies.slice(0, 3));
  }
}, true);

document.addEventListener('input', async (e) => {
  if (isRecording && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    const element = e.target;
    
    // Get multiple selector strategies for robustness
    const strategies = PlaywrightAutoWait.getSelectorStrategies(element);
    const selector = strategies[0]; // Primary strategy
    
    const actionData = {
      agent_type: 'browser',
      action: 'type',
      parameters: { 
        selector,
        alternativeSelectors: strategies.slice(1), // Fallback strategies
        text: element.value,
        type: element.type || 'text'
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    // Send to background
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    // Visual feedback
    highlightElement(element);
    
    console.log('⌨️ Recorded input with strategies:', strategies.slice(0, 3));
  }
});

// Capture navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (isRecording && currentUrl !== lastUrl) {
    const actionData = {
      agent_type: 'browser',
      action: 'navigate',
      parameters: { 
        url: currentUrl
      },
      timestamp: Date.now()
    };
    
    recordedActions.push(actionData);
    
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData
    });
    
    lastUrl = currentUrl;
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Get a unique selector for an element (legacy function, now uses Playwright strategies)
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function getElementSelector(element) {
  // Use Playwright's multi-strategy selector system
  const strategies = PlaywrightAutoWait.getSelectorStrategies(element);
  return strategies[0] || `${element.tagName.toLowerCase()}:nth-child(${getChildIndex(element)})`;
}

/**
 * Get the child index of an element
 * @param {HTMLElement} element - The element
 * @returns {number} Child index
 */
function getChildIndex(element) {
  let index = 1;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}

/**
 * Highlight an element temporarily to show it was recorded
 * @param {HTMLElement} element - The element to highlight
 */
function highlightElement(element) {
  const originalOutline = element.style.outline;
  const originalTransition = element.style.transition;
  
  element.style.transition = 'outline 0.3s ease';
  element.style.outline = '2px solid #4CAF50';
  
  setTimeout(() => {
    element.style.outline = originalOutline;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 300);
  }, 500);
}
