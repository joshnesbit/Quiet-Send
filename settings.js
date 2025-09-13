// settings.js
document.addEventListener('DOMContentLoaded', async () => {
  await loadContacts();
  await loadPreferences();
  setupEventListeners();
});

function setupEventListeners() {
  // Add contact form
  document.getElementById('addContactButton').addEventListener('click', handleAddContact);
  
  // Preferences
  document.getElementById('alwaysSendCopy').addEventListener('change', handlePreferenceChange);
  
  // Enter key in form inputs
  document.getElementById('contactName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddContact();
  });
  
  document.getElementById('contactEmail').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddContact();
  });
}

async function loadContacts() {
  try {
    const contacts = await getContacts();
    const contactsList = document.getElementById('contactsList');
    const noContactsMessage = document.getElementById('noContactsMessage');
    
    if (!contacts || contacts.length === 0) {
      contactsList.style.display = 'none';
      noContactsMessage.style.display = 'block';
      return;
    }
    
    contactsList.style.display = 'block';
    noContactsMessage.style.display = 'none';
    
    contactsList.innerHTML = contacts.map(contact => `
      <div class="contact-item">
        <div class="contact-details">
          <div class="contact-name">${contact.name}</div>
          <div class="contact-email">${contact.email}</div>
          <div class="contact-status ${contact.confirmed ? 'status-confirmed' : 'status-pending'}">
            ${contact.confirmed ? 'Confirmed ✅' : 'Waiting for confirmation ⏳'}
          </div>
        </div>
        <div class="contact-actions">
          ${!contact.confirmed ? `
            <button class="action-button primary" onclick="resendConfirmation('${contact.id}')">
              Resend
            </button>
          ` : ''}
          <button class="action-button danger" onclick="deleteContact('${contact.id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');
    
    // Update add button state
    updateAddButtonState(contacts.length);
    
  } catch (error) {
    console.error('Error loading contacts:', error);
    showMessage('Error loading contacts', 'error');
  }
}

async function loadPreferences() {
  try {
    const preferences = await getUserPreferences();
    document.getElementById('alwaysSendCopy').checked = preferences.alwaysSendCopy || false;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

async function handleAddContact() {
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  
  if (!name || !email) {
    showMessage('Please enter both name and email', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }
  
  try {
    const contacts = await getContacts();
    
    if (contacts.length >= 5) {
      showMessage('You can only add up to 5 contacts', 'error');
      return;
    }
    
    // Check for duplicate email
    if (contacts.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      showMessage('This email is already added', 'error');
      return;
    }
    
    const newContact = {
      id: Date.now().toString(),
      name,
      email,
      confirmed: false,
      addedAt: new Date().toISOString()
    };
    
    await saveContact(newContact);
    
    // Clear form
    nameInput.value = '';
    emailInput.value = '';
    
    showMessage(`Contact added! Confirmation email sent to ${email}`, 'success');
    
    // Reload contacts list
    await loadContacts();
    
  } catch (error) {
    console.error('Error adding contact:', error);
    showMessage('Failed to add contact. Please try again.', 'error');
  }
}

async function handlePreferenceChange() {
  try {
    const alwaysSendCopy = document.getElementById('alwaysSendCopy').checked;
    
    const preferences = await getUserPreferences();
    preferences.alwaysSendCopy = alwaysSendCopy;
    
    await chrome.storage.local.set({ preferences });
    
    showMessage('Preferences saved', 'success');
    
  } catch (error) {
    console.error('Error saving preferences:', error);
    showMessage('Failed to save preferences', 'error');
  }
}

// Global functions for inline event handlers
window.resendConfirmation = async function(contactId) {
  try {
    await resendConfirmationEmail(contactId);
    showMessage('Confirmation email resent', 'success');
  } catch (error) {
    console.error('Error resending confirmation:', error);
    showMessage('Failed to resend confirmation', 'error');
  }
};

window.deleteContact = async function(contactId) {
  if (!confirm('Are you sure you want to delete this contact?')) {
    return;
  }
  
  try {
    await removeContact(contactId);
    showMessage('Contact deleted', 'success');
    await loadContacts();
  } catch (error) {
    console.error('Error deleting contact:', error);
    showMessage('Failed to delete contact', 'error');
  }
};

function updateAddButtonState(contactCount) {
  const addButton = document.getElementById('addContactButton');
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  
  if (contactCount >= 5) {
    addButton.disabled = true;
    addButton.textContent = 'Maximum 5 contacts reached';
    nameInput.disabled = true;
    emailInput.disabled = true;
  } else {
    addButton.disabled = false;
    addButton.textContent = 'Add Contact';
    nameInput.disabled = false;
    emailInput.disabled = false;
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
  
  // Hide message after 3 seconds for success
  if (type === 'success') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }
}

// Backend abstraction functions
async function getContacts() {
  const result = await chrome.storage.local.get(['contacts']);
  return result.contacts || [];
}

async function saveContact(contact) {
  const result = await chrome.storage.local.get(['contacts']);
  const contacts = result.contacts || [];
  
  contacts.push(contact);
  await chrome.storage.local.set({ contacts });
  
  // This would trigger the backend to send confirmation email
  // await sendConfirmationEmail(contact);
}

async function removeContact(contactId) {
  const result = await chrome.storage.local.get(['contacts']);
  const contacts = result.contacts || [];
  
  const updatedContacts = contacts.filter(c => c.id !== contactId);
  await chrome.storage.local.set({ contacts: updatedContacts });
}

async function resendConfirmationEmail(contactId) {
  // This would connect to your backend
  console.log('Resending confirmation for contact:', contactId);
}

async function getUserPreferences() {
  const result = await chrome.storage.local.get(['preferences']);
  return result.preferences || {};
}