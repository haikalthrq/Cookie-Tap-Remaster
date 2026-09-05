// ==========================================
// Cookie Tap - Lobby & Arcade Hub
// ==========================================

// Audio Management
const sfxButton = new Audio("/static/audio/button_tap.mp3");
const bgLobbyMusic = new Audio("/static/audio/lobby_theme.mp3");
bgLobbyMusic.loop = true;
bgLobbyMusic.volume = 0.5;

let isMuted = false;
let musicStarted = false;

function playTapAudio() {
  if (!isMuted) {
    sfxButton.currentTime = 0;
    sfxButton.play().catch(() => {});
  }
}

function toggleLobbyAudio() {
  const btn = document.getElementById("soundToggle");
  isMuted = !isMuted;
  if (isMuted) {
    bgLobbyMusic.pause();
    btn.textContent = "SOUND: MUTED";
    btn.setAttribute("aria-pressed", "false");
    btn.style.backgroundColor = "var(--color-muted)";
  } else {
    bgLobbyMusic.play().catch(() => {});
    btn.textContent = "SOUND: ON";
    btn.setAttribute("aria-pressed", "true");
    btn.style.backgroundColor = "var(--color-accent-magenta)";
  }
}

// Auto-start music on first interaction
document.addEventListener("click", function startLobbyMusic() {
  if (!musicStarted && !isMuted) {
    bgLobbyMusic.play().then(() => { musicStarted = true; }).catch(() => {});
  }
  document.removeEventListener("click", startLobbyMusic);
}, { once: true });

// How to Play Modal Handling
const modal = document.getElementById("howToPlayModal");

function openHowToPlay() {
  playTapAudio();
  if (modal) modal.style.display = "flex";
}

function closeHowToPlay() {
  playTapAudio();
  if (modal) modal.style.display = "none";
}

window.addEventListener("click", (e) => {
  if (e.target === modal) closeHowToPlay();
});

// Keyboard Accessibility (Escape to close any open modal)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (accountModal && accountModal.classList.contains("open")) {
      closeAccountModal();
    }
    if (modal && modal.style.display === "flex") {
      closeHowToPlay();
    }
  }
});

// Arcade Account Modal Management
const accountModal = document.getElementById("accountModal");
const accountGuestView = document.getElementById("accountGuestView");
const accountUserView = document.getElementById("accountUserView");
const accountNotice = document.getElementById("accountNotice");
const modalUsernameDisplay = document.getElementById("modalUsernameDisplay");
const modalCookieDisplay = document.getElementById("modalCookieDisplay");

function handleNavUserClick() {
  playTapAudio();
  const savedUser = localStorage.getItem("username");
  if (savedUser) {
    openAccountModal();
  } else {
    window.location.href = "/login";
  }
}

function openAccountModal() {
  playTapAudio();
  if (!accountModal) return;

  const savedUser = localStorage.getItem("username");
  const savedCookies = parseInt(localStorage.getItem("cookies")) || 0;

  if (savedUser) {
    if (accountUserView) accountUserView.style.display = "flex";
    if (accountGuestView) accountGuestView.style.display = "none";
    if (modalUsernameDisplay) modalUsernameDisplay.textContent = savedUser.toUpperCase();
    if (modalCookieDisplay) modalCookieDisplay.textContent = savedCookies.toLocaleString();
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
  playTapAudio();
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
  playTapAudio();
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
  const savedUser = localStorage.getItem("username");
  if (!savedUser) return;
  playTapAudio();

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

  const payload = JSON.stringify({ request: [savedUser, pass, newName] });
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
      const updatedUser = data.new_username || newName;
      localStorage.setItem("username", updatedUser);
      initHomeSession();
      if (modalUsernameDisplay) modalUsernameDisplay.textContent = updatedUser.toUpperCase();
      showAccountNotice("Arcade callsign updated to " + updatedUser + "! 🚀", "success");
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
  const savedUser = localStorage.getItem("username");
  if (!savedUser) return;
  playTapAudio();

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

  const payload = JSON.stringify({ request: [savedUser, oldPass, newPass] });
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
      localStorage.setItem("password", newPass);
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
  playTapAudio();
  const actionRow = document.getElementById("resetScoreActionRow");
  const confirmBox = document.getElementById("resetScoreConfirmBox");
  const passInput = document.getElementById("resetScorePassInput");
  if (actionRow) actionRow.style.display = show ? "none" : "block";
  if (confirmBox) confirmBox.style.display = show ? "flex" : "none";
  if (passInput) passInput.value = "";
}

function submitResetScore() {
  const savedUser = localStorage.getItem("username");
  if (!savedUser) return;
  playTapAudio();

  const passInput = document.getElementById("resetScorePassInput");
  const submitBtn = document.getElementById("confirmResetScoreBtn");
  const pass = passInput.value;

  if (!pass) {
    showAccountNotice("Please enter password to confirm reset.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Wiping...";

  const payload = JSON.stringify({ request: [savedUser, pass] });
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
      localStorage.setItem("cookies", 0);
      if (modalCookieDisplay) modalCookieDisplay.textContent = "0";
      initHomeSession();
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
  playTapAudio();
  const actionRow = document.getElementById("deleteAccountActionRow");
  const confirmBox = document.getElementById("deleteAccountConfirmBox");
  const passInput = document.getElementById("deleteAccountPassInput");
  if (actionRow) actionRow.style.display = show ? "none" : "block";
  if (confirmBox) confirmBox.style.display = show ? "flex" : "none";
  if (passInput) passInput.value = "";
}

function submitDeleteAccount() {
  const savedUser = localStorage.getItem("username");
  if (!savedUser) return;
  playTapAudio();

  const passInput = document.getElementById("deleteAccountPassInput");
  const submitBtn = document.getElementById("confirmDeleteAccountBtn");
  const pass = passInput.value;

  if (!pass) {
    showAccountNotice("Please enter password to confirm deletion.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Deleting...";

  const payload = JSON.stringify({ request: [savedUser, pass] });
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
      closeAccountModal();
      initHomeSession();
      alert("Account successfully deleted. Returning to Guest mode.");
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

// Dynamic Player Session & Deck Initialization
function initHomeSession() {
  const savedUser = localStorage.getItem("username");
  const savedPass = localStorage.getItem("password");
  const savedCookies = parseInt(localStorage.getItem("cookies")) || 0;
  const navUserLabel = document.getElementById("navUserLabel");
  const navUserBtn = document.getElementById("navUserBtn");
  const homeAuthView = document.getElementById("homeAuthView");
  const homeGuestView = document.getElementById("homeGuestView");
  const marqueeLeftPill = document.getElementById("marqueeLeftPill");
  const marqueeRightPill = document.getElementById("marqueeRightPill");

  if (savedUser) {
    if (navUserLabel) navUserLabel.textContent = savedUser.toUpperCase();
    if (navUserBtn) {
      navUserBtn.title = "Manage Account Profile";
    }
    if (homeAuthView) homeAuthView.style.display = "flex";
    if (homeGuestView) homeGuestView.style.display = "none";
    
    const nameEl = document.getElementById("homeUsernameDisplay");
    const cookieEl = document.getElementById("homeCookieDisplay");
    if (nameEl) nameEl.textContent = savedUser.toUpperCase();
    if (cookieEl) cookieEl.textContent = savedCookies.toLocaleString();

    if (marqueeLeftPill) marqueeLeftPill.textContent = "1P READY";
    if (marqueeRightPill) marqueeRightPill.textContent = "ONLINE";

    if (savedPass) {
      fetch('/showCookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: [savedUser, savedPass] })
      })
      .then(res => res.json())
      .then(data => {
        if (data.respond !== "not found") {
          const serverCookies = parseInt(data.respond) || 0;
          localStorage.setItem("cookies", serverCookies);
          if (cookieEl) cookieEl.textContent = serverCookies.toLocaleString();
          if (modalCookieDisplay) modalCookieDisplay.textContent = serverCookies.toLocaleString();
        }
      })
      .catch(() => {});
    }
  } else {
    if (navUserLabel) navUserLabel.textContent = "LOGIN";
    if (navUserBtn) {
      navUserBtn.title = "Player Login";
    }
    if (homeAuthView) homeAuthView.style.display = "none";
    if (homeGuestView) homeGuestView.style.display = "flex";

    if (marqueeLeftPill) marqueeLeftPill.textContent = "INSERT COIN";
    if (marqueeRightPill) marqueeRightPill.textContent = "CREDIT: 99";
  }
}

function handleHomeLogout() {
  playTapAudio();
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  localStorage.removeItem("cookies");
  closeAccountModal();
  initHomeSession();
}

// Live High-Score Marquee Sync
function syncLobbyChampion() {
  fetch('/showLeaderboard')
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const champCookies = parseInt(data[0][0]) || 0;
        const champName = data[0][1] || "PILOT";
        const tickerEl = document.getElementById("lobbyChampionTicker");
        if (tickerEl) {
          tickerEl.textContent = champCookies.toLocaleString() + " COOKIES • CHAMPION: " + champName.toUpperCase();
        }
      }
    })
    .catch(err => console.error("Champion ticker sync error:", err));
}

// Initialize session & champion ticker
initHomeSession();
syncLobbyChampion();
