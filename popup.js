document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const setupView = document.getElementById('setup-view');
  const sessionView = document.getElementById('session-view');
  const goalInput = document.getElementById('goal-input');
  const charCount = document.getElementById('char-count');
  const strictnessInput = document.getElementById('strictness');
  const thresholdSlider = document.getElementById('threshold-slider');
  const thresholdValue = document.getElementById('threshold-value');
  const startBtn = document.getElementById('start-btn');
  const endBtn = document.getElementById('end-btn');
  const optionsBtn = document.getElementById('options-btn');
  const backToSetupBtn = document.getElementById('back-to-setup');
  const softModeBtn = document.getElementById('soft-mode');
  const hardModeBtn = document.getElementById('hard-mode');
  
  // Session view elements
  const currentGoal = document.getElementById('current-goal');
  const currentMode = document.getElementById('current-mode');
  const currentThreshold = document.getElementById('current-threshold');
  const sessionTime = document.getElementById('session-time');


  // Load saved settings
  loadSettings();
  checkActiveSession();

  // Event Listeners
  goalInput.addEventListener('input', updateCharCount);
  thresholdSlider.addEventListener('input', updateThresholdValue);
  
  softModeBtn.addEventListener('click', () => setStrictness('soft'));
  hardModeBtn.addEventListener('click', () => setStrictness('hard'));
  
  startBtn.addEventListener('click', startSession);
  endBtn.addEventListener('click', endSession);
  optionsBtn.addEventListener('click', openOptions);
  backToSetupBtn.addEventListener('click', showSetupView);

  // Functions
  function updateCharCount() {
    const count = goalInput.value.length;
    charCount.textContent = count;
    

    if (count > 190) {
      charCount.style.color = '#ff6b6b';
    } else if (count > 150) {
      charCount.style.color = '#ffa726';
    } else {
      charCount.style.color = '#666';
    }
  }

  function updateThresholdValue() {
    const value = parseFloat(thresholdSlider.value).toFixed(2);
    thresholdValue.textContent = value;
  }

  function setStrictness(mode) {
    strictnessInput.value = mode;
    
    // Update UI
    softModeBtn.classList.toggle('active', mode === 'soft');
    hardModeBtn.classList.toggle('active', mode === 'hard');
  }

  function loadSettings() {
    chrome.storage.local.get(['defaultStrictness', 'defaultThreshold'], (result) => {
      if (result.defaultStrictness) {
        setStrictness(result.defaultStrictness);
      }
      if (result.defaultThreshold) {
        thresholdSlider.value = result.defaultThreshold;
        updateThresholdValue();
      }
    });
  }

  function checkActiveSession() {
    chrome.runtime.sendMessage({ type: "CHECK_SESSION" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error checking session:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.session) {
        console.log("Found active session:", response.session);
        showSessionView(response.session);
      } else {
        console.log("No active session found");
      }
    });
  }

  function showSessionView(session) {
    
    if (!setupView || !sessionView) {
      console.error("Setup or Session view not found!");
      return;
    }
    
    setupView.classList.add('hidden');
    sessionView.classList.remove('hidden');
    
    // Update session info
    currentGoal.textContent = session.goal || "No goal set";
    currentMode.textContent = session.strictness === 'soft' ? 'Soft Mode' : 'Hard Mode';
    currentThreshold.textContent = (session.threshold || 0.3).toFixed(2);
    
    // elapsed time
    if (session.startedAt) {
      const elapsed = Date.now() - session.startedAt;
      const minutes = Math.floor(elapsed / 60000);
      
      if (minutes < 1) {
        sessionTime.textContent = 'Just now';
      } else if (minutes === 1) {
        sessionTime.textContent = '1 minute ago';
      } else {
        sessionTime.textContent = `${minutes} minutes ago`;
      }
    } else {
      sessionTime.textContent = 'Just now';
    }
  }

  function showSetupView() {
    if (!setupView || !sessionView) return;
    
    sessionView.classList.add('hidden');
    setupView.classList.remove('hidden');
  }

  function startSession() {
    const goal = goalInput.value.trim();
    if (!goal) {
      showError('Please enter a focus goal');
      goalInput.focus();
      return;
    }
    
    if (goal.length > 200) {
      showError('Goal must be 200 characters or less');
      return;
    }

    const sessionData = {
      goal: goal,
      strictness: strictnessInput.value,
      threshold: parseFloat(thresholdSlider.value)
    };

    chrome.runtime.sendMessage(
      { type: "START_SESSION", ...sessionData },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error starting session:", chrome.runtime.lastError);
          showError('Failed to start session: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          sessionData.startedAt = Date.now(); 
          showSessionView(sessionData);
        } else {
          showError('Failed to start session');
        }
      }
    );
  }

  function endSession() {
    if (confirm('Are you sure you want to end this focus session?')) {
      chrome.runtime.sendMessage({ type: "END_SESSION" }, (response) => {
        if (response && response.success) {
          showSetupView();
          goalInput.value = '';
          updateCharCount();
        }
      });
    }
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function showError(message) {
    // Simple error notification
    const errorEl = document.createElement('div');
    errorEl.className = 'error-notification';
    errorEl.textContent = message;
    errorEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff6b6b;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
      errorEl.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => errorEl.remove(), 300);
    }, 3000);
  }

  // Initialize
  updateCharCount();
  updateThresholdValue();
});