// popup.js
let currentTab = null;
let selectedContactId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

async function initializePopup() {
  // Get current tab info
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  // Display page title
  const pageTitleEl = document.getElementById('pageTitle');
  pageTitleEl.textContent = `Saving: "${currentTab.title}"`;
  
  // Load and display contacts
  await loadContacts();
  
  // Load user preferences
  await loadPreferences();
}

function setupEventListeners() {
  // Contact selection
  document.addEventListener('change', (e) => {
    if (e.target.name === 'contact') {
      selectedContactId = e.target.value;
      updateSaveButton();
    }
  });
  
  // Save button
  document.getElementById('saveButton').addEventListener('click', handleSave);
  
  // Open settings
  document.getElementById('openSettings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

async function loadContacts() {
  try {
    const contacts = await getContacts();
    const contactsList = document.getElementById('contactsList');
    const noContacts = document.getElementById('noContacts');
    
    if (!contacts || contacts.length === 0) {
      contactsList.style.display = 'none';
      noContacts.style.display = 'block';
      return;
    }
    
    contactsList.style.display = 'block';
    noContacts.style.display = 'none';
    
    contactsList.innerHTML = contacts.map(contact => `
      <label class="contact-option">
        <input type="radio" name="contact" value="${contact.id}">
        <div class="contact-info">
          <div class="contact-name">${contact.name}</div>
          <div class="contact-email">${contact.email}</div>
        </div>
        <div class="contact-status ${contact.confirmed ? 'status-confirmed' : 'status-pending'}">
          ${contact.confirmed ? '✅' : '⏳'}
        </div>
      </label>
    `).join('');
    
  } catch (error) {
    console.error('Error loading contacts:', error);
    showMessage('Error loading contacts', 'error');
  }
}

async function loadPreferences() {
  try {
    const preferences = await getUserPreferences();
    const sendCopyCheckbox = document.getElementById('sendCopyToSelf');
    sendCopyCheckbox.checked = preferences.alwaysSendCopy || false;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

function updateSaveButton() {
  const saveButton = document.getElementById('saveButton');
  saveButton.disabled = !selectedContactId;
}

async function handleSave() {
  if (!selectedContactId) {
    showMessage('Please select a contact', 'error');
    return;
  }
  
  try {
    const noteInput = document.getElementById('noteInput');
    const sendCopyCheckbox = document.getElementById('sendCopyToSelf');
    
    const linkData = {
      url: currentTab.url,
      title: currentTab.title,
      contactId: selectedContactId,
      note: noteInput.value.trim(),
      sendCopyToSelf: sendCopyCheckbox.checked,
      savedAt: new Date().toISOString()
    };
    
    await saveLink(linkData);
    
    // Find contact name for success message
    const contacts = await getContacts();
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    const contactName = selectedContact ? selectedContact.name : 'them';
    
    showMessage(`✅ Saved! This will be sent to ${contactName} in Sunday's digest.`, 'success');
    
    // Clear form
    noteInput.value = '';
    document.querySelector('input[name="contact"]:checked').checked = false;
    selectedContactId = null;
    updateSaveButton();
    
  } catch (error) {
    console.error('Error saving link:', error);
    showMessage('Failed to save link. Please try again.', 'error');
  }
}

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
  
  // Hide message after 3 seconds for success, keep error visible
  if (type === 'success') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }
}

// Backend abstraction functions
async function getContacts() {
  // This would connect to your backend
  // For now, return mock data from storage
  const result = await chrome.storage.local.get(['contacts']);
  return result.contacts || [];
}

async function saveLink(linkData) {
  // This would connect to your backend
  // For now, save to local storage
  const result = await chrome.storage.local.get(['savedLinks']);
  const savedLinks = result.savedLinks || [];
  
  savedLinks.push({
    ...linkData,
    id: Date.now().toString()
  });
  
  await chrome.storage.local.set({ savedLinks });
}

async function getUserPreferences() {
  // This would connect to your backend
  const result = await chrome.storage.local.get(['preferences']);
  return result.preferences || {};
}