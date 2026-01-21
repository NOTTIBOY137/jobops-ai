// Popup script for extension settings

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status')
  const apiUrlInput = document.getElementById('apiUrl')
  const saveButton = document.getElementById('saveSettings')
  
  // Load saved settings
  const { apiUrl } = await chrome.storage.sync.get(['apiUrl'])
  if (apiUrl) {
    apiUrlInput.value = apiUrl
    statusEl.textContent = 'Connected'
    statusEl.className = 'status connected'
  }
  
  // Save settings
  saveButton.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim()
    if (!apiUrl) {
      alert('Please enter an API URL')
      return
    }
    
    await chrome.storage.sync.set({ apiUrl })
    statusEl.textContent = 'Settings saved!'
    statusEl.className = 'status connected'
    
    setTimeout(() => {
      statusEl.textContent = 'Connected'
    }, 2000)
  })
})
