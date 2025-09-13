// background.js
// Background service worker for Quiet Send

chrome.runtime.onInstalled.addListener(() => {
  console.log("Quiet Send extension installed and ready.");
  
  // Initialize default preferences
  chrome.storage.local.get(['preferences'], (result) => {
    if (!result.preferences) {
      chrome.storage.local.set({
        preferences: {
          alwaysSendCopy: false
        }
      });
    }
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getTabInfo") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({
        title: tabs[0].title,
        url: tabs[0].url
      });
    });
    return true; // Keep message channel open for async response
  }
});

// Weekly digest scheduling would go here
// This would integrate with your backend to trigger Sunday digests
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "weeklyDigest") {
    console.log("Time to send weekly digests!");
    // This would call your backend function to generate and send digests
  }
});

// Set up weekly alarm (for demo purposes - would be handled by backend)
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("weeklyDigest", {
    when: getNextSundayAfternoon(),
    periodInMinutes: 7 * 24 * 60 // Weekly
  });
});

function getNextSundayAfternoon() {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(15, 0, 0, 0); // 3 PM
  return nextSunday.getTime();
}