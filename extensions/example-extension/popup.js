// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const testButton = document.getElementById('testButton');
  const infoDiv = document.getElementById('info');
  const statusDiv = document.getElementById('status');

  // Check extension status
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response && response.enabled) {
      statusDiv.textContent = '✓ Extension Active';
      statusDiv.style.background = '#e8f5e9';
    } else {
      statusDiv.textContent = '✗ Extension Inactive';
      statusDiv.style.background = '#ffebee';
    }
  });

  // Test button handler
  testButton.addEventListener('click', () => {
    infoDiv.textContent = 'Testing connection...';
    
    chrome.runtime.sendMessage(
      { type: 'LOG', data: 'Test button clicked' },
      (response) => {
        if (response && response.success) {
          infoDiv.textContent = '✓ Connection successful!';
          infoDiv.style.color = '#2e7d32';
        } else {
          infoDiv.textContent = '✗ Connection failed';
          infoDiv.style.color = '#c62828';
        }
      }
    );
  });
});
