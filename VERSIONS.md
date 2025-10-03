# Version History

## v1.0.2 – 2025-01-27
- Updated LICENSE to MIT License for open source distribution

## v1.0.1 – 2025-09-12
- Added "alarms" permission to manifest.json to enable chrome.alarms API usage in background script.

## v1.0.0 – 2025-01-27
- Complete rewrite as "Quiet Send" - a thoughtful link sharing extension
- Added popup.html with link saving interface and contact selection
- Added settings.html for contact management and preferences
- Created warm, minimal UI design with soft colors and rounded elements
- Implemented contact management (add, delete, resend confirmation)
- Added note input for personal messages with saved links
- Implemented "send copy to myself" option
- Added backend abstraction functions for future integration
- Updated manifest.json with options_page for settings
- Added proper form validation and error handling
- Designed for weekly digest email system (backend integration pending)
- Maximum 5 contacts limit with confirmation flow
- Local storage implementation as placeholder for backend