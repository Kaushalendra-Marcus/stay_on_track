const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall', 'www', 'com', 'http',
    'https', 'html', 'php', 'asp', 'aspx', 'net', 'org', 'edu', 'gov'
]);

// Tokenize text into words
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !STOP_WORDS.has(word));
}


function createVector(tokens) {
    const vector = {};
    tokens.forEach(token => {
        vector[token] = (vector[token] || 0) + 1;
    });
    return vector;
}


function cosineSimilarity(tokens1, tokens2) {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const vec1 = createVector(tokens1);
    const vec2 = createVector(tokens2);

    
    const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

   
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const word of allWords) {
        const v1 = vec1[word] || 0;
        const v2 = vec2[word] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    }

    
    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}


function jaccardSimilarity(tokens1, tokens2) {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}


function calculateSimilarity(goal, pageText) {
    
    const goalTokens = tokenize(goal.toLowerCase());
    const pageTokens = tokenize(pageText.toLowerCase());

   
    const cosineScore = cosineSimilarity(goalTokens, pageTokens);
    const jaccardScore = jaccardSimilarity(goalTokens, pageTokens);

    
    return Math.max(cosineScore, jaccardScore);
}


async function shouldIgnoreYoutube() {
    try {
        const result = await chrome.storage.local.get(['ignoreYoutube']);
        console.log("ignoreYoutube setting:", result.ignoreYoutube);

        
        return result.ignoreYoutube === true;
    } catch (error) {
        console.error("Error checking ignoreYoutube setting:", error);
        return false;
    }
}


const allPlatforms = [
    'chatgpt.com',
    'openai.com',
    'claude.ai',
    'anthropic.com',
    'deepseek.com',
    'gemini.google.com',
    'bard.google.com',
    'copilot.microsoft.com',
    'bing.com/chat',
    'perplexity.ai',
    'you.com',
    'phind.com',
    'character.ai',
    'huggingface.co',
    'poe.com',
    'replit.com',
    'notion.ai',
    'quora.com/poe',
    'meta.ai',
    'mistral.ai',
    'cohere.com',
    'runwayml.com',
    'stability.ai',
    'midjourney.com',
    'leonardo.ai',
    'firefly.adobe.com',
    'youtube.com',
    'youtu.be'
];
function isYouTubeUrl(url) {
    return allPlatforms.some(u => url.includes(u));
}


let currentSession = null;
let warningTimers = new Map();


async function checkAllOpenTabs() {
    if (!currentSession) return;

    try {
        const tabs = await chrome.tabs.query({});
        const ignoreYoutube = await shouldIgnoreYoutube(); // No goal parameter

        console.log(`Checking ${tabs.length} tabs. Ignore YouTube: ${ignoreYoutube}`);

        for (const tab of tabs) {
            
            if (!tab.url || !tab.title) continue;

            
            if (tab.url.startsWith('chrome://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('about:')) {
                continue;
            }

            
            if (ignoreYoutube && isYouTubeUrl(tab.url)) {
                console.log(`Ignoring YouTube tab: ${tab.title} (${tab.url})`);
                continue; // Skip this tab
            }

            
            const pageText = `${tab.title} ${tab.url}`;
            const goal = currentSession.goal;
            const threshold = currentSession.threshold || 0.3;
            const similarity = calculateSimilarity(goal, pageText);

            console.log(`Tab: ${tab.title}, Similarity: ${similarity}, Threshold: ${threshold}`);

            if (similarity < threshold) {
                console.log(`Off-topic detected: ${tab.title} (similarity: ${similarity})`);

                // Send warning with retry logic
                const sendWarning = () => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "OFF_TOPIC",
                        goal: goal,
                        strictness: currentSession.strictness,
                        similarity: similarity,
                        threshold: threshold
                    }).catch(error => {
                        console.log(`Couldn't send to tab ${tab.id}, retrying:`, error);
                        setTimeout(sendWarning, 500);
                    });
                };

                sendWarning();

               
                if (currentSession.strictness === "hard") {
                    console.log(`Hard mode: Scheduling closure for tab ${tab.id} in 3 seconds`);
                    const timerId = setTimeout(() => {
                        chrome.tabs.get(tab.id, (existingTab) => {
                            if (!chrome.runtime.lastError && existingTab) {
                                console.log(`Hard mode: Closing tab ${tab.id} - ${tab.title}`);
                                chrome.tabs.remove(tab.id).catch(error => {
                                    console.log("Couldn't close tab:", error);
                                });
                            } else {
                                console.log(`Tab ${tab.id} already closed`);
                            }
                            warningTimers.delete(tab.id);
                        });
                    }, 3000);

                    warningTimers.set(tab.id, timerId);
                }
            } else {
                console.log(`Tab is on-topic: ${tab.title} (similarity: ${similarity})`);
            }
        }
    } catch (error) {
        console.error("Error checking open tabs:", error);
    }
}


chrome.storage.local.get(['focusSession'], (result) => {
    console.log("Extension loaded. Storage result:", result);

    if (result && result.focusSession) {
        currentSession = result.focusSession;
        console.log("Active session found:", currentSession);
        updateExtensionIcon(true);

        // Check existing tabs when extension loads
        setTimeout(() => {
            checkAllOpenTabs();
        }, 2000); // Wait 2 seconds for content scripts to load
    } else {
        console.log("No active session found");
    }
});


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("Tab updated:", tabId, changeInfo.status, tab.url);

    
    if (changeInfo.status !== 'complete' || !tab.url || !tab.title) {
        console.log("Skipping - incomplete tab or missing info");
        return;
    }

    
    if (!currentSession) {
        console.log("No active session, skipping");
        return;
    }

    console.log("Active session:", currentSession.goal);

    
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:')) {
        console.log("Skipping internal URL");
        return;
    }

    // Check if it's YouTube and should be ignored
    const ignoreYoutube = await shouldIgnoreYoutube(); 
    console.log(`Ignore YouTube (always if setting enabled): ${ignoreYoutube}`);

    if (ignoreYoutube && isYouTubeUrl(tab.url)) {
        console.log(`Ignoring YouTube tab: ${tab.title} (${tab.url})`);
        return; 
    }


    const pageText = `${tab.title} ${tab.url}`;
    const goal = currentSession.goal;
    const threshold = currentSession.threshold || 0.3;

  
    const similarity = calculateSimilarity(goal, pageText);
    console.log(`Similarity for "${tab.title}": ${similarity}`);


    if (similarity < threshold) {
        console.log(`Off-topic detected: ${tab.title} (similarity: ${similarity} < ${threshold})`);

      
        chrome.tabs.sendMessage(tabId, {
            type: "OFF_TOPIC",
            goal: goal,
            strictness: currentSession.strictness,
            similarity: similarity,
            threshold: threshold
        }).catch(() => {
            console.log(`Content script not ready for tab ${tabId}, retrying...`);
            
            setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                    type: "OFF_TOPIC",
                    goal: goal,
                    strictness: currentSession.strictness,
                    similarity: similarity,
                    threshold: threshold
                }).catch(console.error);
            }, 500);
        });

        
        if (currentSession.strictness === "hard") {
            console.log(`Hard mode: Scheduling closure for tab ${tabId} in 6 seconds`);
            const timerId = setTimeout(() => {
                chrome.tabs.get(tabId, (existingTab) => {
                    if (!chrome.runtime.lastError && existingTab) {
                        console.log(`Hard mode: Auto-closing tab ${tabId} - ${tab.title}`);
                        chrome.tabs.remove(tabId).catch(error => {
                            console.log("Couldn't close tab (might already be closed):", error);
                        });
                    } else {
                        console.log(`Tab ${tabId} already closed`);
                    }
                    warningTimers.delete(tabId);
                });
            }, 6000);

            warningTimers.set(tabId, timerId);
        }
    } else {
        console.log(`✓ Page is on-topic: ${tab.title} (similarity: ${similarity} >= ${threshold})`);
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request.type);

    switch (request.type) {
        case "GET_SESSION":
            sendResponse({ session: currentSession });
            break;

        case "CANCEL_CLOSURE":
            console.log("Cancelling closure for tab:", sender.tab?.id);
            if (sender.tab && warningTimers.has(sender.tab.id)) {
                clearTimeout(warningTimers.get(sender.tab.id));
                warningTimers.delete(sender.tab.id);
                console.log(`Cancelled closure timer for tab ${sender.tab.id}`);
            }
            sendResponse({ success: true });
            break;

        case "CLOSE_THIS_TAB":
            console.log("Manual close requested for tab:", sender.tab?.id);
            if (sender.tab && sender.tab.id) {
                chrome.tabs.get(sender.tab.id, (tab) => {
                    if (chrome.runtime.lastError || !tab) {
                        console.log("Tab already closed or doesn't exist");
                        sendResponse({ success: false, error: "Tab not found" });
                    } else {
                        chrome.tabs.remove(sender.tab.id, () => {
                            if (chrome.runtime.lastError) {
                                console.log("Error closing tab:", chrome.runtime.lastError);
                                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                            } else {
                                console.log("Tab closed manually");
                                sendResponse({ success: true });
                            }
                        });
                    }
                });
            } else {
                sendResponse({ success: false, error: "No tab ID provided" });
            }
            return true; 

        case "START_SESSION":
            console.log("Starting session with:", request);
            currentSession = {
                goal: request.goal,
                strictness: request.strictness,
                threshold: request.threshold,
                startedAt: Date.now()
            };
            chrome.storage.local.set({ focusSession: currentSession }, () => {
                console.log("Session saved to storage");
                updateExtensionIcon(true);
                // Check all currently open tabs
                checkAllOpenTabs();
                sendResponse({ success: true });
            });
            return true; 

        case "END_SESSION":
            console.log("Ending session");
            currentSession = null;
            warningTimers.forEach(timer => clearTimeout(timer));
            warningTimers.clear();

            chrome.storage.local.remove(['focusSession'], () => {
                console.log("Session removed from storage");
                updateExtensionIcon(false);
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async

        case "CHECK_SESSION":
            console.log("Checking session, current:", currentSession);
            sendResponse({ session: currentSession });
            break;
    }
    return true; 
});


function updateExtensionIcon(isActive) {
    console.log("Updating extension icon, active:", isActive);

    const iconPath = isActive ? {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png"
    } : {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128-disabled.png"
    };

    chrome.action.setIcon({ path: iconPath }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error setting icon:", chrome.runtime.lastError);
        }
    });
}