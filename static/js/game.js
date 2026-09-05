// ==========================================
// Cookie Tap - Game Client & Vault Manager
// ==========================================

// Audio Pooling & Sound Management
const sfxTap = [
  new Audio("/static/audio/cookie_tap.mp3"),
  new Audio("/static/audio/cookie_tap.mp3"),
  new Audio("/static/audio/cookie_tap.mp3")
];
let tapAudioIdx = 0;
function playTapSound() {
  if (isMuted) return;
  sfxTap[tapAudioIdx].currentTime = 0;
  sfxTap[tapAudioIdx].play().catch(() => {});
  tapAudioIdx = (tapAudioIdx + 1) % sfxTap.length;
}

const sfxButton = new Audio("/static/audio/button_tap.mp3");
const sfxMalingSpawn = new Audio("/static/audio/maling_spawn.mp3");
const sfxMalingHit = new Audio("/static/audio/maling_hit.mp3");
const sfxMalingMati = new Audio("/static/audio/maling_mati.mp3");
const sfxKemalingan = new Audio("/static/audio/kemalingan.mp3");
const bgMusic = new Audio("/static/audio/cookie_theme.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

let isMuted = false;
let bgMusicStarted = false;

function playBtnAudio() {
  if (!isMuted) {
    sfxButton.currentTime = 0;
    sfxButton.play().catch(() => {});
  }
}

function toggleAudio() {
  const btn = document.getElementById("soundToggle");
  isMuted = !isMuted;
  if (isMuted) {
    bgMusic.pause();
    btn.textContent = "SOUND: MUTED";
    btn.setAttribute("aria-pressed", "false");
    btn.style.backgroundColor = "var(--color-muted)";
  } else {
    bgMusic.play().catch(() => {});
    btn.textContent = "SOUND: ON";
    btn.setAttribute("aria-pressed", "true");
    btn.style.backgroundColor = "var(--color-accent-magenta)";
  }
}

// Auto-start BGM on first user interaction
document.addEventListener("click", function startBGMOnFirstClick() {
  if (!bgMusicStarted && !isMuted) {
    bgMusic.play().then(() => { bgMusicStarted = true; }).catch(() => {});
  }
  document.removeEventListener("click", startBGMOnFirstClick);
}, { once: true });

// Initialize User & Player Tag
let currentUser = (typeof username !== "undefined" && username) ? username : localStorage.getItem("username");
let currentPass = (typeof password !== "undefined" && password) ? password : localStorage.getItem("password");
let cacheShowMyCookie = 0;

const playerBadge = document.getElementById("playerBadge");
const guestWarning = document.getElementById("guestWarning");

// Tap Handling, Combo System & Particles
let tapcookie = 0;
let totalTaps = 0;
let combo = 1;
let comboStreak = 0;
let comboTimer = null;
let peakCombo = 1;
let thievesDefeated = 0;
let sessionGiftsSent = 0;

const comboBadge = document.getElementById("comboBadge");
const tapCountDisplay = document.getElementById("tapCountDisplay");
const tickerStatusText = document.getElementById("tickerStatusText");
const vaultBalanceNumber = document.getElementById("vaultBalanceNumber");
const vaultStatMaxCombo = document.getElementById("vaultStatMaxCombo");
const vaultStatTotalTaps = document.getElementById("vaultStatTotalTaps");
const vaultStatThievesDefeated = document.getElementById("vaultStatThievesDefeated");
const vaultStatGiftsSent = document.getElementById("vaultStatGiftsSent");

function updateVaultTelemetry() {
  if (vaultBalanceNumber) vaultBalanceNumber.textContent = (cacheShowMyCookie || 0).toLocaleString();
  if (vaultStatMaxCombo) vaultStatMaxCombo.textContent = "x" + peakCombo;
  if (vaultStatTotalTaps) vaultStatTotalTaps.textContent = totalTaps.toLocaleString();
  if (vaultStatThievesDefeated) vaultStatThievesDefeated.textContent = thievesDefeated.toLocaleString();
  if (vaultStatGiftsSent) vaultStatGiftsSent.textContent = sessionGiftsSent.toLocaleString();
}

function updateTickerStatus(text) {
  if (tickerStatusText) tickerStatusText.innerHTML = text;
}

function taptap(event) {
  totalTaps++;
  if (tapCountDisplay) tapCountDisplay.textContent = totalTaps.toLocaleString();

  // Deterministic Integer Streak Combo Accumulation
  // Every 5 consecutive taps within 1.8s adds +1 to combo multiplier, capped at 10x
  comboStreak++;
  combo = Math.min(10, 1 + Math.floor(comboStreak / 5));
  const roundedCombo = combo;
  if (roundedCombo > peakCombo) {
    peakCombo = roundedCombo;
  }

  if (comboBadge) {
    comboBadge.textContent = "x" + roundedCombo;
    if (roundedCombo > 1) {
      comboBadge.classList.add("active");
      if (!isThiefActive) {
        updateTickerStatus("&#9889; COMBO x" + roundedCombo + "!");
      }
    }
  }

  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    comboStreak = 0;
    combo = 1;
    if (comboBadge) {
      comboBadge.textContent = "x1";
      comboBadge.classList.remove("active");
    }
    if (!isThiefActive) {
      updateTickerStatus("BAKE &amp; DEFEND! &#127850;");
    }
  }, 1800);

  // Add to cookies
  const earned = roundedCombo;
  tapcookie += earned;
  cacheShowMyCookie = (cacheShowMyCookie || 0) + earned;
  document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
  localStorage.setItem("cookies", cacheShowMyCookie);
  updateVaultTelemetry();

  playTapSound();

  const cookieTarget = document.getElementById("cookieTap");
  const cookieAura = document.querySelector(".cookie-aura");

  // Tactile cookie press bounce and aura bloom
  if (cookieTarget) {
    cookieTarget.classList.add("is-pressed");
    setTimeout(() => cookieTarget.classList.remove("is-pressed"), 90);
  }
  if (cookieAura) {
    cookieAura.classList.add("pulse-tap");
    setTimeout(() => cookieAura.classList.remove("pulse-tap"), 110);
  }

  // Spawn particle at click coordinate or centered over the giant cookie
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (event && event.clientX) {
    x = event.clientX;
    y = event.clientY;
  } else if (cookieTarget) {
    const rect = cookieTarget.getBoundingClientRect();
    x = rect.left + rect.width / 2 + (Math.random() * 40 - 20);
    y = rect.top + rect.height / 3 + (Math.random() * 20 - 10);
  }
  spawnParticle(x, y, earned > 1 ? "+" + earned + " COMBO!" : "+1");

  // Dynamic Tap Provocation: Intense baking activity & combo streaks attract thieves!
  if (!isThiefActive && (cacheShowMyCookie || 0) >= 35 && (Date.now() - lastThiefEndTime > THIEF_COOLDOWN_MS)) {
    // Scent scales directly with combo level:
    // Combo x1: 2% chance per tap (streak >= 4)
    // Combo x2-x4: 6% chance per tap (streak >= 5)
    // Combo x5+: 12% chance per tap (intense bakery aroma!)
    const tapProvokeChance = roundedCombo >= 5 ? 0.12 : (roundedCombo >= 2 ? 0.06 : 0.02);
    if (comboStreak >= 4 && Math.random() < tapProvokeChance) {
      checkAndSpawnThief();
    }
  }
}

function spawnParticle(x, y, text, isNegative = false) {
  const particle = document.createElement("span");
  particle.className = "tap-particle" + (isNegative ? " negative" : "");
  particle.textContent = text || "+1";
  particle.style.left = (x - 20) + "px";
  particle.style.top = (y - 30) + "px";
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 700);
}

// Fetch My Cookies & Server Sync
function showMyCookie() {
  if (!currentUser) {
    const localSaved = parseInt(localStorage.getItem("cookies")) || 0;
    cacheShowMyCookie = localSaved;
    document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
    updateVaultTelemetry();
    return;
  }

  const payload = JSON.stringify({ request: [currentUser, currentPass] });
  fetch('/showCookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    if (data.respond !== "not found") {
      const serverBase = parseInt(data.respond) || 0;
      cacheShowMyCookie = serverBase + tapcookie;
      document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
      localStorage.setItem("cookies", cacheShowMyCookie);
      updateVaultTelemetry();
    }
  })
  .catch(err => console.error("Error fetching cookies:", err));
}

// Periodic Background Sync every 5s
function sendCookie() {
  if (tapcookie === 0 || !currentUser) return;
  const syncDot = document.getElementById("syncDot");
  const syncStatus = document.getElementById("syncStatus");
  if (syncDot) syncDot.classList.add("syncing");
  if (syncStatus) syncStatus.textContent = "Syncing...";

  const currentTaps = tapcookie;
  const payload = JSON.stringify({ request: [currentUser, currentPass, currentTaps] });
  
  fetch('/sendCookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    tapcookie -= currentTaps;
    if (data && data.cookies !== undefined) {
      cacheShowMyCookie = data.cookies + tapcookie;
      document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
      localStorage.setItem("cookies", cacheShowMyCookie);
      updateVaultTelemetry();
    }
    if (syncDot) syncDot.classList.remove("syncing");
    if (syncStatus) syncStatus.textContent = "Synced";
  })
  .catch(err => {
    console.error("Sync error:", err);
    if (syncDot) syncDot.classList.remove("syncing");
    if (syncStatus) syncStatus.textContent = "Offline";
  });
}
setInterval(sendCookie, 5000);

// Social Gifting Quick Chips & Submission
function setGiftAmount(amount) {
  const input = document.getElementById("giftQuantity");
  input.value = (parseInt(input.value || 0) + amount);
}

function setGiftMax() {
  const input = document.getElementById("giftQuantity");
  input.value = Math.max(0, cacheShowMyCookie);
}

function submitGiveCookies() {
  if (!currentUser) {
    showGiftNotice("Please log in to transfer cookies to other players.", "error");
    return;
  }

  const targetInput = document.getElementById("targetUsername");
  const quantityInput = document.getElementById("giftQuantity");

  const targetname = targetInput.value.trim();
  const quantity = parseInt(quantityInput.value);

  if (!targetname) {
    showGiftNotice("Please enter a valid friend's username.", "error");
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    showGiftNotice("Please enter a positive cookie amount to send.", "error");
    return;
  }
  if (quantity > cacheShowMyCookie) {
    showGiftNotice("You only have " + cacheShowMyCookie + " cookies to share. Keep tapping!", "error");
    return;
  }

  playBtnAudio();

  const payload = JSON.stringify({ request: [currentUser, quantity, targetname] });
  const submitBtn = document.getElementById("giveCookieBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  fetch('/giveCookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Cookies Now";
    if (data.respond && data.respond[0] === "succes") {
      showGiftNotice("Successfully sent " + quantity + " cookies to " + targetname + "! 🍪", "success");
      sessionGiftsSent += quantity;
      cacheShowMyCookie = data.respond[1];
      document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
      updateVaultTelemetry();
      targetInput.value = "";
      quantityInput.value = "";
    } else {
      showGiftNotice("Transfer failed: Recipient was not found, or balance was insufficient.", "error");
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Cookies Now";
    showGiftNotice("Network error during transfer. Please try again.", "error");
    console.error(err);
  });
}

function showGiftNotice(msg, type) {
  const notice = document.getElementById("giftNotice");
  notice.textContent = msg;
  notice.className = "ds-notice " + type;
  setTimeout(() => {
    if (type === "success") notice.className = "ds-notice";
  }, 5000);
}

// ==========================================================================
// Interactive Thief Hazard Event & Dynamic Difficulty Scaling (DDS)
// ==========================================================================
let isThiefActive = false;
let activeThiefDefendFn = null;
let thiefTimer = null;
let lastThiefEndTime = 0;
const THIEF_COOLDOWN_MS = 6500; // 6.5s breather between thief invasions

function getThiefInterval() {
  const cookies = Math.max(0, cacheShowMyCookie || 0);
  // Dynamic Frequency Curve:
  // - 35 to 100 cookies: every 24 - 32 seconds (gentle introduction)
  // - 100 to 500 cookies: every 16 - 22 seconds (active arcade pressure)
  // - 500 to 2,000 cookies: every 12 - 16 seconds (intense defense)
  // - 10,000+ cookies: every 8 - 12 seconds (high-stakes peak arcade)
  const factor = Math.min(1, Math.max(0, (Math.log10(Math.max(10, cookies)) - 1.5) / 2.5));
  const baseSec = Math.round(26 - factor * 16); // 26s down to 10s
  const jitter = Math.floor(Math.random() * 4) - 2; // ±2s jitter
  return Math.max(8, baseSec + jitter) * 1000;
}

function scheduleNextThief(delayMs = null) {
  if (thiefTimer) clearTimeout(thiefTimer);
  const delay = delayMs !== null ? delayMs : getThiefInterval();
  thiefTimer = setTimeout(() => {
    checkAndSpawnThief();
  }, delay);
}

function checkAndSpawnThief() {
  const now = Date.now();
  if (isThiefActive || (now - lastThiefEndTime < THIEF_COOLDOWN_MS)) {
    scheduleNextThief(3500);
    return;
  }
  // Safe zone: require at least 35 cookies before thieves start appearing
  if ((cacheShowMyCookie || 0) >= 35) {
    thief();
  } else {
    scheduleNextThief(6000);
  }
}

function thief() {
  if (isThiefActive) return;
  isThiefActive = true;

  const currentCookies = Math.max(0, cacheShowMyCookie || 0);

  const thiefBanner = document.getElementById("thiefBanner");
  const statusPill = document.getElementById("cabinetStatusPill");
  if (thiefBanner) thiefBanner.classList.add("active");
  if (statusPill) {
    statusPill.textContent = "⚠️ INVASION!";
    statusPill.style.backgroundColor = "var(--color-accent-magenta)";
  }
  updateTickerStatus("&#9888;&#65039; DEFEND VAULT!");

  if (!isMuted) {
    sfxMalingSpawn.currentTime = 0;
    sfxMalingSpawn.play().catch(() => {});
  }

  const container = document.getElementById("myObjects");
  const thiefEl = document.createElement("div");
  thiefEl.className = "thief-sprite-container";

  // Health bar pips (3 hits to defeat)
  const healthBar = document.createElement("div");
  healthBar.className = "thief-health-bar";
  const pips = [];
  for (let i = 0; i < 3; i++) {
    const pip = document.createElement("span");
    pip.className = "thief-health-pip";
    healthBar.appendChild(pip);
    pips.push(pip);
  }
  thiefEl.appendChild(healthBar);

  const img = document.createElement("img");
  img.className = "thief-sprite-img";
  img.src = "/static/img/thief.png";
  img.alt = "Cookie Thief Sprite";
  thiefEl.appendChild(img);
  container.appendChild(thiefEl);

  let hp = 3;
  let clickCount = 0;

  function hitThief() {
    if (clickCount >= hp) return;
    clickCount++;

    // Update visual health pips
    if (pips[clickCount - 1]) {
      pips[clickCount - 1].classList.add("hit");
    }

    if (!isMuted) {
      sfxMalingHit.currentTime = 0;
      sfxMalingHit.play().catch(() => {});
    }

    if (clickCount >= hp) {
      // Defeated!
      thievesDefeated++;
      if (!isMuted) {
        sfxMalingMati.currentTime = 0;
        sfxMalingMati.play().catch(() => {});
      }
      // Reward Bounty: 5% of stash (min 30, max 2500 cookies)
      const bounty = Math.max(30, Math.min(2500, Math.floor(currentCookies * 0.05)));
      cacheShowMyCookie = (cacheShowMyCookie || 0) + bounty;
      tapcookie += bounty;
      document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
      localStorage.setItem("cookies", cacheShowMyCookie);
      updateVaultTelemetry();
      spawnParticle(posX, posY, "+" + bounty + " BOUNTY! 🎯");
      cleanupThief();
    }
  }

  thiefEl.addEventListener("click", hitThief);
  activeThiefDefendFn = hitThief;

  // Calculate path toward the giant cookie target
  const cookieRect = document.getElementById("cookieTap").getBoundingClientRect();
  const targetX = cookieRect.left + cookieRect.width / 2 - 35;
  const targetY = cookieRect.top + cookieRect.height / 2 - 35;

  const maxX = Math.max(100, window.innerWidth - 80);
  const maxY = Math.max(100, window.innerHeight - 80);
  let posX = Math.random() > 0.5 ? Math.random() * 100 : maxX - 100;
  let posY = Math.random() * (maxY - 200) + 100;

  thiefEl.style.left = posX + "px";
  thiefEl.style.top = posY + "px";

  // Dynamic Speed Curve:
  // - Starts at 1.40 px/frame (~4.5s travel) at 35-100 cookies
  // - Smoothly increases with log10(cookies)
  // - Hard capped at 2.45 px/frame (~2.3s travel) so ordinary human reaction + 3 clicks is ALWAYS 100% fair and winnable!
  const progress = Math.min(1, Math.max(0, (Math.log10(Math.max(10, currentCookies)) - 1.5) / 2.5));
  const speed = 1.40 + progress * 1.05; // Range: 1.40 to 2.45

  const moveInterval = setInterval(() => {
    if (!isThiefActive) {
      clearInterval(moveInterval);
      return;
    }

    const deltaX = targetX - posX;
    const deltaY = targetY - posY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < 20) {
      // Thief reached cookie vault! Deduct cookies
      clearInterval(moveInterval);
      if (clickCount < hp) {
        thiefPenalty();
      }
      cleanupThief();
      return;
    }

    posX += (deltaX / distance) * speed;
    posY += (deltaY / distance) * speed;
    thiefEl.style.left = posX + "px";
    thiefEl.style.top = posY + "px";
  }, 16);

  function thiefPenalty() {
    if (!isMuted) {
      sfxKemalingan.currentTime = 0;
      sfxKemalingan.play().catch(() => {});
    }

    // Steal 15% of total cookies (minimum 20, max 500)
    const stolen = Math.min(500, Math.max(20, Math.floor((cacheShowMyCookie || 0) * 0.15)));
    
    // Shatter active combo multiplier & clear pending timer!
    clearTimeout(comboTimer);
    comboStreak = 0;
    combo = 1;
    if (comboBadge) {
      comboBadge.textContent = "x1";
      comboBadge.classList.remove("active");
    }

    // Spawn floating negative particle over cookie
    const cRect = document.getElementById("cookieTap").getBoundingClientRect();
    spawnParticle(cRect.left + cRect.width / 2, cRect.top, "-" + stolen + " STOLEN! 🏃💨", true);

    // Flash Alert Banner with breached state
    if (thiefBanner) {
      thiefBanner.classList.add("active");
      const title = thiefBanner.querySelector(".thief-alert-title");
      const hint = thiefBanner.querySelector(".thief-alert-hint");
      if (title) title.textContent = "⚠️ VAULT BREACHED! -" + stolen + " COOKIES! ⚠️";
      if (hint) hint.textContent = "The thief looted your vault and shattered your combo multiplier!";
      setTimeout(() => {
        if (!isThiefActive) {
          thiefBanner.classList.remove("active");
          if (title) title.textContent = "⚠️ THIEF INVASION! ⚠️";
          if (hint) hint.innerHTML = 'A thief is stealing cookies! Click it 3 times or press <kbd>D</kbd> to defend!';
        }
      }, 4000);
    }

    if (currentUser) {
      const thiefPenaltyPayload = JSON.stringify({ request: [currentUser, currentPass, -stolen] });
      fetch('/sendCookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: thiefPenaltyPayload
      })
      .then(() => showMyCookie())
      .catch(err => console.error("Penalty sync error:", err));
    } else {
      cacheShowMyCookie = Math.max(0, (cacheShowMyCookie || 0) - stolen);
      document.getElementById("showCookies").textContent = cacheShowMyCookie.toLocaleString();
      localStorage.setItem("cookies", cacheShowMyCookie);
      updateVaultTelemetry();
    }
  }

  function cleanupThief() {
    isThiefActive = false;
    activeThiefDefendFn = null;
    if (statusPill) {
      statusPill.textContent = "DEFENSE: SECURE";
      statusPill.style.backgroundColor = "var(--color-accent-magenta)";
    }
    if (thiefEl.parentNode) thiefEl.remove();
    updateTickerStatus("BAKE &amp; DEFEND! &#127850;");
    lastThiefEndTime = Date.now();
    scheduleNextThief(); // Queue next invasion respecting cooldown and cookie scaling
  }
}

// ==========================================
// Account Modal & Profile Management
// ==========================================
const accountModal = document.getElementById("accountModal");
const accountGuestView = document.getElementById("accountGuestView");
const accountUserView = document.getElementById("accountUserView");
const accountNotice = document.getElementById("accountNotice");
const accountNavLabel = document.getElementById("accountNavLabel");
const modalUsernameDisplay = document.getElementById("modalUsernameDisplay");
const modalCookieDisplay = document.getElementById("modalCookieDisplay");

function updateNavAndPlayerBadge() {
  if (currentUser) {
    if (playerBadge) playerBadge.textContent = currentUser.toUpperCase();
    if (accountNavLabel) accountNavLabel.textContent = currentUser.toUpperCase();
    if (guestWarning) guestWarning.style.display = "none";
  } else {
    if (playerBadge) playerBadge.textContent = "GUEST";
    if (accountNavLabel) accountNavLabel.textContent = "ACCOUNT";
    if (guestWarning) guestWarning.style.display = "block";
  }
}
updateNavAndPlayerBadge();

function openAccountModal() {
  playBtnAudio();
  if (!accountModal) return;

  if (currentUser) {
    if (accountUserView) accountUserView.style.display = "flex";
    if (accountGuestView) accountGuestView.style.display = "none";
    if (modalUsernameDisplay) modalUsernameDisplay.textContent = currentUser;
    if (modalCookieDisplay) modalCookieDisplay.textContent = (cacheShowMyCookie || 0).toLocaleString();
    switchAccountTab('profile');
  } else {
    if (accountGuestView) accountGuestView.style.display = "flex";
    if (accountUserView) accountUserView.style.display = "none";
  }

  resetAccountNoticesAndForms();
  accountModal.classList.add("open");
  accountModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAccountModal() {
  if (!accountModal) return;
  accountModal.classList.remove("open");
  accountModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetAccountNoticesAndForms();
}

function handleBackdropClick(e) {
  if (e.target === accountModal) {
    closeAccountModal();
  }
}

function switchAccountTab(tab) {
  playBtnAudio();
  const tabBtnProfile = document.getElementById("tabBtnProfile");
  const tabBtnDanger = document.getElementById("tabBtnDanger");
  const tabContentProfile = document.getElementById("tabContentProfile");
  const tabContentDanger = document.getElementById("tabContentDanger");

  if (tab === 'profile') {
    if (tabBtnProfile) {
      tabBtnProfile.classList.add("active");
      tabBtnProfile.setAttribute("aria-selected", "true");
    }
    if (tabBtnDanger) {
      tabBtnDanger.classList.remove("active");
      tabBtnDanger.setAttribute("aria-selected", "false");
    }
    if (tabContentProfile) tabContentProfile.style.display = "flex";
    if (tabContentDanger) tabContentDanger.style.display = "none";
  } else if (tab === 'danger') {
    if (tabBtnDanger) {
      tabBtnDanger.classList.add("active");
      tabBtnDanger.setAttribute("aria-selected", "true");
    }
    if (tabBtnProfile) {
      tabBtnProfile.classList.remove("active");
      tabBtnProfile.setAttribute("aria-selected", "false");
    }
    if (tabContentDanger) tabContentDanger.style.display = "flex";
    if (tabContentProfile) tabContentProfile.style.display = "none";
  }
  if (accountNotice) {
    accountNotice.style.display = "none";
    accountNotice.className = "ds-notice";
  }
}

function showAccountNotice(msg, type) {
  if (!accountNotice) return;
  accountNotice.textContent = msg;
  accountNotice.className = "ds-notice " + type;
  accountNotice.style.display = "block";
}

function resetAccountNoticesAndForms() {
  if (accountNotice) {
    accountNotice.style.display = "none";
    accountNotice.textContent = "";
    accountNotice.className = "ds-notice";
  }
  toggleResetScoreConfirm(false);
  toggleDeleteAccountConfirm(false);

  const newUserInput = document.getElementById("newUsernameInput");
  const userConfirmPass = document.getElementById("userConfirmPassInput");
  const oldPassInput = document.getElementById("oldPasswordInput");
  const newPassInput = document.getElementById("newPasswordInput");
  if (newUserInput) newUserInput.value = "";
  if (userConfirmPass) userConfirmPass.value = "";
  if (oldPassInput) oldPassInput.value = "";
  if (newPassInput) newPassInput.value = "";
}

function submitChangeUsername() {
  if (!currentUser) return;
  playBtnAudio();

  const newUserInput = document.getElementById("newUsernameInput");
  const userConfirmPass = document.getElementById("userConfirmPassInput");
  const submitBtn = document.getElementById("changeUserBtn");

  const newName = newUserInput.value.trim();
  const pass = userConfirmPass.value;

  if (!newName || newName.length > 15) {
    showAccountNotice("Username must be between 1 and 15 characters.", "error");
    return;
  }
  if (!pass) {
    showAccountNotice("Please enter your current password.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  const payload = JSON.stringify({ request: [currentUser, pass, newName] });
  fetch('/changeUsername', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save New Username";

    if (data.respond === "succes") {
      currentUser = data.new_username || newName;
      localStorage.setItem("username", currentUser);
      updateNavAndPlayerBadge();
      if (modalUsernameDisplay) modalUsernameDisplay.textContent = currentUser;
      showAccountNotice("Arcade callsign updated to " + currentUser + "! 🚀", "success");
      newUserInput.value = "";
      userConfirmPass.value = "";
    } else if (data.respond === "invalid_credentials") {
      showAccountNotice("Password incorrect. Please check your credentials.", "error");
    } else if (data.respond === "existed") {
      showAccountNotice("Callsign already taken by another pilot! Try another.", "error");
    } else {
      showAccountNotice("Failed to update username. Please try again.", "error");
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save New Username";
    showAccountNotice("Network error. Please try again.", "error");
    console.error(err);
  });
}

function submitChangePassword() {
  if (!currentUser) return;
  playBtnAudio();

  const oldPassInput = document.getElementById("oldPasswordInput");
  const newPassInput = document.getElementById("newPasswordInput");
  const submitBtn = document.getElementById("changePassBtn");

  const oldPass = oldPassInput.value;
  const newPass = newPassInput.value;

  if (!oldPass) {
    showAccountNotice("Please enter your current password.", "error");
    return;
  }
  if (!newPass || newPass.length > 15) {
    showAccountNotice("New password must be between 1 and 15 characters.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  const payload = JSON.stringify({ request: [currentUser, oldPass, newPass] });
  fetch('/changePassword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save New Password";

    if (data.respond === "succes") {
      currentPass = newPass;
      localStorage.setItem("password", currentPass);
      showAccountNotice("Vault password successfully changed! 🔑", "success");
      oldPassInput.value = "";
      newPassInput.value = "";
    } else if (data.respond === "invalid_credentials") {
      showAccountNotice("Current password is incorrect.", "error");
    } else {
      showAccountNotice("Failed to update password. Please try again.", "error");
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save New Password";
    showAccountNotice("Network error. Please try again.", "error");
    console.error(err);
  });
}

function toggleResetScoreConfirm(show) {
  playBtnAudio();
  const actionRow = document.getElementById("resetScoreActionRow");
  const confirmBox = document.getElementById("resetScoreConfirmBox");
  const passInput = document.getElementById("resetScorePassInput");
  if (actionRow) actionRow.style.display = show ? "none" : "block";
  if (confirmBox) confirmBox.style.display = show ? "flex" : "none";
  if (passInput) passInput.value = "";
}

function submitResetScore() {
  if (!currentUser) return;
  playBtnAudio();

  const passInput = document.getElementById("resetScorePassInput");
  const submitBtn = document.getElementById("confirmResetScoreBtn");
  const pass = passInput.value;

  if (!pass) {
    showAccountNotice("Please enter password to confirm reset.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Wiping...";

  const payload = JSON.stringify({ request: [currentUser, pass] });
  fetch('/resetScore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Yes, Wipe Score to 0";

    if (data.respond === "succes") {
      cacheShowMyCookie = 0;
      tapcookie = 0;
      comboStreak = 0;
      combo = 1;
      clearTimeout(comboTimer);
      if (comboBadge) {
        comboBadge.textContent = "x1";
        comboBadge.classList.remove("active");
      }
      localStorage.setItem("cookies", 0);
      document.getElementById("showCookies").textContent = "0";
      if (modalCookieDisplay) modalCookieDisplay.textContent = "0";
      updateVaultTelemetry();
      toggleResetScoreConfirm(false);
      showAccountNotice("Score wiped clean! Cookie vault has been reset to 0.", "success");
    } else if (data.respond === "invalid_credentials") {
      showAccountNotice("Incorrect password. Score reset cancelled.", "error");
    } else {
      showAccountNotice("Reset failed. Please try again.", "error");
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Yes, Wipe Score to 0";
    showAccountNotice("Network error. Please try again.", "error");
    console.error(err);
  });
}

function toggleDeleteAccountConfirm(show) {
  playBtnAudio();
  const actionRow = document.getElementById("deleteAccountActionRow");
  const confirmBox = document.getElementById("deleteAccountConfirmBox");
  const passInput = document.getElementById("deleteAccountPassInput");
  if (actionRow) actionRow.style.display = show ? "none" : "block";
  if (confirmBox) confirmBox.style.display = show ? "flex" : "none";
  if (passInput) passInput.value = "";
}

function submitDeleteAccount() {
  if (!currentUser) return;
  playBtnAudio();

  const passInput = document.getElementById("deleteAccountPassInput");
  const submitBtn = document.getElementById("confirmDeleteAccountBtn");
  const pass = passInput.value;

  if (!pass) {
    showAccountNotice("Please enter password to confirm deletion.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Deleting...";

  const payload = JSON.stringify({ request: [currentUser, pass] });
  fetch('/deleteAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Permanently Delete Account";

    if (data.respond === "succes") {
      localStorage.removeItem("username");
      localStorage.removeItem("password");
      localStorage.removeItem("cookies");
      showAccountNotice("Account deleted. Relocating to lobby...", "success");
      setTimeout(() => location.replace("/"), 800);
    } else if (data.respond === "invalid_credentials") {
      showAccountNotice("Password incorrect. Account deletion cancelled.", "error");
    } else {
      showAccountNotice("Failed to delete account. Please try again.", "error");
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "Permanently Delete Account";
    showAccountNotice("Network error. Please try again.", "error");
    console.error(err);
  });
}

function handleLogout() {
  playBtnAudio();
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  localStorage.removeItem("cookies");
  location.replace("/");
}

// Keyboard Controls: 'Space' to tap cookie, 'D' to strike thief, 'Escape' to close modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && accountModal && accountModal.classList.contains("open")) {
    closeAccountModal();
    return;
  }
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.repeat) return; // Prevent holding spacebar from spamming taps!
  if (e.code === "Space") {
    e.preventDefault();
    const cookieTarget = document.getElementById("cookieTap");
    if (cookieTarget) {
      cookieTarget.classList.add("is-pressed");
    }
    taptap();
  } else if ((e.key === "d" || e.key === "D") && isThiefActive && activeThiefDefendFn) {
    e.preventDefault();
    activeThiefDefendFn();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    const cookieTarget = document.getElementById("cookieTap");
    if (cookieTarget) {
      cookieTarget.classList.remove("is-pressed");
    }
  }
});

// Initial Load & Thief Invasion Scheduler
showMyCookie();
scheduleNextThief(5000);
