// Background service worker for the extension
console.log('Example Browser Agent Extension - Background Script Loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage
  chrome.storage.local.set({
    enabled: true,
    timestamp: Date.now(),
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled || false });
    });
    return true; // Indicates async response
  }
  
  if (message.type === 'LOG') {
    console.log('[Content Script]:', message.data);
    sendResponse({ success: true });
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tab.url);
  }
});
