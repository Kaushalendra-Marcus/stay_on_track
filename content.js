// content.js - For DOM manipulation on web pages
let currectWarning = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "OFF_TOPIC") {
    showWarning(
      request.goal,
      request.strictness,
      request.similarity,
      request.threshold
    );
    sendResponse({ success: true });
  }
  return true;
});

function showWarning(goal, strictness, similarity, threshold) {
  if (currectWarning) currectWarning.remove();

  const warning = document.createElement("div");
  warning.id = "stayon-track-warning";

  warning.innerHTML = `
    <div class="sot-warning-overlay"></div>
    <div class="sot-warning-modal">
      <div class="sot-warning-header">
        <h2>OFF-TOPIC DETECTED</h2>
        <p>This page doesn't seem related to your goal:</p>
        <div class="sot-goal-display">"${goal}"</div>
        <p class="similarity-info">
          Similarity: ${similarity.toFixed(2)} (threshold: ${threshold})
        </p>
      </div>

      <div class="sot-warning-body">
        <p>You are in <strong>${strictness} mode</strong></p>
        ${strictness === "hard"
      ? `<p class="sot-timer">
                This tab will close in <span id="sot-countdown">6</span> seconds
               </p>`
      : `<p>You can choose to continue or close this tab.</p>`
    }
      </div>

      <div class="sot-warning-actions">
        <button id="sot-continue-btn" class="sot-btn sot-btn-secondary">
          Continue anyway
        </button>
        <button id="sot-close-btn" class="sot-btn sot-btn-primary">
          Close Tab
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(warning);
  currectWarning = warning;

  addWarningStyles();

  if (strictness === "hard") startCountdown();

  document.getElementById("sot-continue-btn").onclick = () => {
    warning.remove();
    currectWarning = null;
  };

  document.getElementById("sot-close-btn").onclick = () => {
    chrome.runtime.sendMessage({ type: "CLOSE_THIS_TAB" });
  };
}

function startCountdown() {
  let seconds = 6;
  const el = document.getElementById("sot-countdown");

  const timer = setInterval(() => {
    seconds--;
    if (el) el.textContent = seconds;
    if (seconds <= 0) clearInterval(timer);
  }, 1000);
}

function addWarningStyles() {
  const styleId = "sot-warning-styles";
  document.getElementById(styleId)?.remove();

  const style = document.createElement("style");
  style.id = styleId;

  style.textContent = `
    #stayon-track-warning {
      position: fixed !important;
      inset: 0;
      z-index: 2147483647;
      isolation: isolate;
      font-family: system-ui, sans-serif;
    }

    .sot-warning-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.85) !important;
    }

    .sot-warning-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 520px;
      box-shadow: 0 20px 60px rgba(0,0,0,.4);
      overflow: hidden;
      animation: sot-slideIn .3s ease-out;
    }

    .sot-warning-header {
      padding: 28px;
      background: #f41347;
      color: white;
      text-align: center;
    }

    .sot-warning-body {
      padding: 24px;
      text-align: center;
      color: #2d3748;
    }

    .sot-warning-actions {
      padding: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
      background: #f8fafc;
    }

    .sot-btn {
      padding: 12px 28px;
      border-radius: 10px;
      border: none;
      font-weight: 700;
      cursor: pointer;
    }

    .sot-btn-primary {
      background: #f41347;
      color: white;
    }

    .sot-btn-secondary {
      background: #e5e7eb;
      color: #111827;
    }

    @keyframes sot-slideIn {
      from { opacity: 0; transform: translate(-50%, -55%); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }
  `;

  document.documentElement.appendChild(style);
}


console.log("Stay On Track content script loaded successfully");