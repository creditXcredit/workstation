// Content script that runs on all pages
console.log('Example Browser Agent Extension - Content Script Loaded');

// Send message to background script
chrome.runtime.sendMessage(
  {
    type: 'LOG',
    data: `Content script loaded on ${window.location.href}`,
  },
  (response) => {
    if (response && response.success) {
      console.log('Message sent to background script');
    }
  }
);

// Add a visual indicator to the page
function addIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'browser-agent-indicator';
  indicator.textContent = '🤖 Browser Agent Active';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 999999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(indicator);
  
  // Remove after 3 seconds
  setTimeout(() => {
    indicator.style.transition = 'opacity 0.5s';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 500);
  }, 3000);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addIndicator);
} else {
  addIndicator();
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  sendResponse({ received: true });
});
