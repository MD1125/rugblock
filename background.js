//background.js - this just monitors navigation etc.

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs[0]?.id) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'INIT' }, function (response) {
      if (chrome.runtime.lastError) {
        console.warn('Message failed:', chrome.runtime.lastError.message);
      } else {
        console.log('Content script responded:', response);
      }
    });
  }
});
