# STAY ON TASK
## A Chrome Extension

## Project Structure

```
icons/                  
background.js      
content.js            
manifest.json         
options.css         
options.html           
options.js             
popup.css              
popup.html             
popup.js              
similarity.js          
```
## Demo
https://x.com/Kaushal__marcus/status/2002007784586662366

## Screenshots
<img width="491" height="837" alt="image" src="https://github.com/user-attachments/assets/aafbfb73-5351-4f2f-968f-f466caaa4430" />

<img width="984" height="975" alt="image" src="https://github.com/user-attachments/assets/57fa0683-c482-4961-90ab-c0c7ea48d626" />

## File Descriptions

### Core Configuration
- **manifest.json**: The main configuration file that defines the extension's metadata, permissions, declared content scripts, background scripts, and user interface components like popup and options page.

### Background Script
- **background.js**: A service worker that runs in the background, independent of any particular webpage. Handles events, manages state, and performs tasks that need to persist across browser sessions or work with browser APIs.

### Content Script
- **content.js**: Injected into web pages to interact with and modify the DOM. Has access to the webpage's content but runs in an isolated environment, separate from the page's own JavaScript.

### User Interface Components

#### Popup Interface
- **popup.html**: The HTML structure that appears when users click the extension icon in the browser toolbar.
- **popup.css**: Styles for the popup interface.
- **popup.js**: JavaScript that handles user interactions within the popup.

#### Options Page
- **options.html**: A dedicated page for extension configuration, accessible via browser's extension management.
- **options.css**: Styles for the options page interface.
- **options.js**: JavaScript that manages settings, preferences, and configuration logic.

### Utility Script
- **similarity.js**: A specialized module containing algorithms or functions for calculating similarities (likely text or data comparisons).

### Assets
- **icons/**: Contains icon files in various sizes (typically 16x16, 48x48, 128x128 pixels) for different display contexts within the browser.

## Extension Flow

1. **User Interaction**: User clicks extension icon → popup.html is displayed
2. **Background Processing**: background.js handles events and manages state
3. **Page Interaction**: content.js modifies web pages based on extension logic
4. **Configuration**: Users access options.html for settings customization
5. **Utility Functions**: similarity.js provides specialized algorithms for the extension's core functionality

## Setup Instructions

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the directory containing these files
4. The extension will appear in your browser toolbar

---
