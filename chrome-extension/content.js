// Content script to extract job data and inject save button

function detectATS() {
  const url = window.location.href
  
  if (url.includes('greenhouse.io')) return 'Greenhouse'
  if (url.includes('lever.co')) return 'Lever'
  if (url.includes('workday.com')) return 'Workday'
  if (url.includes('ashbyhq.com')) return 'Ashby'
  if (url.includes('smartrecruiters.com')) return 'SmartRecruiters'
  if (url.includes('icims.com')) return 'iCIMS'
  if (url.includes('taleo.net')) return 'Taleo'
  if (url.includes('jobvite.com')) return 'Jobvite'
  if (url.includes('bamboohr.com')) return 'BambooHR'
  if (url.includes('linkedin.com/jobs')) return 'LinkedIn'
  if (url.includes('indeed.com')) return 'Indeed'
  
  return 'Unknown'
}

function extractJobData() {
  const url = window.location.href
  const ats = detectATS()
  let company = ''
  let role = ''
  let location = ''
  let jobDescription = ''
  
  // LinkedIn
  if (url.includes('linkedin.com/jobs')) {
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title')
    role = titleEl?.textContent?.trim() || ''
    
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__primary-description-without-tagline a')
    company = companyEl?.textContent?.trim() || ''
    
    const locationEl = document.querySelector('.job-details-jobs-unified-top-card__primary-description-without-tagline .job-details-jobs-unified-top-card__bullet')
    location = locationEl?.textContent?.trim() || ''
    
    const descEl = document.querySelector('.jobs-description__text')
    jobDescription = descEl?.textContent?.trim() || ''
  }
  
  // Indeed
  else if (url.includes('indeed.com')) {
    const titleEl = document.querySelector('[data-testid="job-title"]')
    role = titleEl?.textContent?.trim() || ''
    
    const companyEl = document.querySelector('[data-testid="inlineHeader-companyName"]')
    company = companyEl?.textContent?.trim() || ''
    
    const locationEl = document.querySelector('[data-testid="job-location"]')
    location = locationEl?.textContent?.trim() || ''
    
    const descEl = document.querySelector('#jobDescriptionText')
    jobDescription = descEl?.textContent?.trim() || ''
  }
  
  // Greenhouse
  else if (url.includes('greenhouse.io')) {
    const titleEl = document.querySelector('.app-title')
    role = titleEl?.textContent?.trim() || ''
    
    const companyEl = document.querySelector('.company-name')
    company = companyEl?.textContent?.trim() || ''
    
    const locationEl = document.querySelector('.location')
    location = locationEl?.textContent?.trim() || ''
    
    const descEl = document.querySelector('#content')
    jobDescription = descEl?.textContent?.trim() || ''
  }
  
  // Lever
  else if (url.includes('lever.co')) {
    const titleEl = document.querySelector('.posting-headline h2')
    role = titleEl?.textContent?.trim() || ''
    
    const companyEl = document.querySelector('.main-header-logo img')
    company = companyEl?.alt || ''
    
    const locationEl = document.querySelector('.posting-categories .posting-category')
    location = locationEl?.textContent?.trim() || ''
    
    const descEl = document.querySelector('.content-section')
    jobDescription = descEl?.textContent?.trim() || ''
  }
  
  // Generic fallback - try common selectors
  if (!role) {
    role = document.querySelector('h1, .job-title, [data-job-title]')?.textContent?.trim() || ''
  }
  if (!company) {
    company = document.querySelector('.company-name, [data-company-name], .employer')?.textContent?.trim() || ''
  }
  if (!jobDescription) {
    jobDescription = document.querySelector('.job-description, .description, #description')?.textContent?.trim() || ''
  }
  
  return {
    company,
    role,
    location,
    jobDescription,
    jobUrl: url,
    source: ats
  }
}

function createSaveButton() {
  // Remove existing button if present
  const existing = document.getElementById('jobops-save-button')
  if (existing) existing.remove()
  
  const button = document.createElement('button')
  button.id = 'jobops-save-button'
  button.textContent = 'Save to JobOps'
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 24px;
    background: #0ea5e9;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: background 0.2s;
  `
  
  button.addEventListener('mouseenter', () => {
    button.style.background = '#0284c7'
  })
  
  button.addEventListener('mouseleave', () => {
    button.style.background = '#0ea5e9'
  })
  
  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Saving...'
    
    try {
      const jobData = extractJobData()
      
      // Get API URL from storage or use default
      const { apiUrl } = await chrome.storage.sync.get(['apiUrl'])
      const baseUrl = apiUrl || 'http://localhost:3000'
      
      // Get auth token (user should be logged in on the web app)
      const { authToken } = await chrome.storage.sync.get(['authToken'])
      
      const response = await fetch(`${baseUrl}/api/applications/save-from-extension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(jobData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        button.textContent = '✓ Saved!'
        button.style.background = '#10b981'
        setTimeout(() => {
          button.remove()
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      button.textContent = '✗ Error'
      button.style.background = '#ef4444'
      setTimeout(() => {
        button.disabled = false
        button.textContent = 'Save to JobOps'
        button.style.background = '#0ea5e9'
      }, 2000)
    }
  })
  
  document.body.appendChild(button)
}

// Wait for page to load, then inject button
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSaveButton)
} else {
  createSaveButton()
}

// Re-inject on navigation (for SPAs)
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(createSaveButton, 1000)
  }
}).observe(document, { subtree: true, childList: true })
