// Background service worker for JobOps extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('JobOps AI extension installed')
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveJob') {
    // Handle job save (if needed)
    sendResponse({ success: true })
  }
  return true
})
