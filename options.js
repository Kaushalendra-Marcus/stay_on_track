document.addEventListener("DOMContentLoaded", function () {
    const defaultStrictness = document.getElementById('default-strictness');
    const defaultThreshold = document.getElementById('default-threshold');
    const thresholdDisplay = document.getElementById('threshold-display');
    const sessionTimeout = document.getElementById('session-timeout');
    const enableNotifications = document.getElementById('enable-notifications');
    const autoStartBrowser = document.getElementById('auto-start-browser');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const statusMessage = document.getElementById('status-message');
    const backToExtension = document.getElementById('back-to-extension');
    const ignoreYoutube = document.getElementById('ignore-youtube');

    loadSettings();

    defaultThreshold.addEventListener("input", updateThresholdDisplay);
    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetToDefaults);
    clearDataBtn.addEventListener('click', clearAllData);
    backToExtension.addEventListener('click', () => {
        window.close();
    })

    function updateThresholdDisplay() {
        thresholdDisplay.textContent = defaultThreshold.value;
    }

    function loadSettings() {
        chrome.storage.local.get([
            'defaultStrictness',
            'defaultThreshold',
            'sessionTimeout',
            'enableNotifications',
            'autoStartBrowser',
            'ignoreYoutube'
        ], (result) => {
            if (result.defaultStrictness) {
                defaultStrictness.value = result.defaultStrictness;
            }
            if (result.defaultThreshold) {
                defaultThreshold.value = result.defaultThreshold;
                updateThresholdDisplay();
            }
            if (result.sessionTimeout !== undefined) {
                sessionTimeout.value = result.sessionTimeout;
            }
            if (result.enableNotifications !== undefined) {
                enableNotifications.checked = result.enableNotifications;
            }
            if (result.autoStartBrowser !== undefined) {
                autoStartBrowser.checked = result.autoStartBrowser;
            }
            if (result.ignoreYoutube !== undefined) {
                ignoreYoutube.checked = result.ignoreYoutube;
            }
        })
    }

    function saveSettings() {
        const settings = {
            defaultStrictness: defaultStrictness.value,
            defaultThreshold: parseFloat(defaultThreshold.value),
            sessionTimeout: parseInt(sessionTimeout.value) || 120,
            enableNotifications: enableNotifications.checked,
            autoStartBrowser: autoStartBrowser.checked,
            ignoreYoutube: ignoreYoutube.checked
        }
        chrome.storage.local.set(settings, () => {
            showStatus('Settings saved successfully!', 'success');
        })
    }
    function resetToDefaults() {
        if (confirm('Reset all settings to default values?')) {
            const defaults = {
                defaultStrictness: 'soft',
                defaultThreshold: 0.3,
                sessionTimeout: 120,
                enableNotifications: true,
                autoStartBrowser: true,
                ignoreYoutube: true
            };

            defaultStrictness.value = defaults.defaultStrictness;
            defaultThreshold.value = defaults.defaultThreshold;
            sessionTimeout.value = defaults.sessionTimeout;
            enableNotifications.checked = defaults.enableNotifications;
            autoStartBrowser.checked = defaults.autoStartBrowser;
            ignoreYoutube.checked = defaults.ignoreYoutube;

            updateThresholdDisplay();
            showStatus('Settings reset to defaults', 'info');
        }
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 3000)
    }

    function clearAllData() {
        if (confirm("This will delete all saved sessions and settings. Continue?")) {
            chrome.storage.local.clear(() => {
                showStatus('All data cleared successfully', 'success')
                setTimeout(() => { location.reload() }, 1000)
            })
        }
    }
    updateThresholdDisplay();
});