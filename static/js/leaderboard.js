// ==========================================
// Cookie Tap - Leaderboard & Ranking Viewer
// ==========================================

const sfxButton = new Audio("/static/audio/button_tap.mp3");

function playBtnAudio() {
  sfxButton.currentTime = 0;
  sfxButton.play().catch(() => {});
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let lastLeaderboardSnapshot = "";

function fetchLeaderboard() {
  fetch('/showLeaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'false'
  })
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("rankingsContainer");
    const ticker = document.getElementById("topPlayerTicker");
    const countBadge = document.getElementById("playerCountBadge");

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="loading-notice">No bakers recorded yet. Be the first to tap!</div>';
      ticker.textContent = "BE THE FIRST TO SET A RECORD!";
      countBadge.textContent = "PLAYERS: 0";
      lastLeaderboardSnapshot = "";
      return;
    }

    // Fast fingerprinting check: skip DOM teardown if leaderboard hasn't changed
    const snapshot = JSON.stringify(data);
    if (snapshot === lastLeaderboardSnapshot) {
      return;
    }
    lastLeaderboardSnapshot = snapshot;

    countBadge.textContent = "PLAYERS: " + data.length;

    // Update champion ticker
    const champ = data[0];
    if (champ) {
      ticker.textContent = Number(champ[0]).toLocaleString() + " COOKIES • CHAMPION: " + champ[1];
    }

    container.innerHTML = "";
    data.forEach((entry, index) => {
      const cookies = Number(entry[0]);
      const username = entry[1];
      const rank = index + 1;

      const item = document.createElement("div");
      item.className = "ranking-item";
      if (rank === 1) item.classList.add("rank-1");
      else if (rank === 2) item.classList.add("rank-2");
      else if (rank === 3) item.classList.add("rank-3");

      let rankDisplay = "#" + rank;
      if (rank === 1) rankDisplay = "&#129351; 1";
      else if (rank === 2) rankDisplay = "&#129352; 2";
      else if (rank === 3) rankDisplay = "&#129353; 3";

      item.innerHTML = `
        <div class="player-info">
          <span class="player-rank">${rankDisplay}</span>
          <span class="player-name">${escapeHtml(username)}</span>
        </div>
        <span class="player-cookies">${cookies.toLocaleString()} &#127850;</span>
      `;
      container.appendChild(item);
    });
  })
  .catch(err => {
    console.error("Error loading leaderboard:", err);
    const container = document.getElementById("rankingsContainer");
    container.innerHTML = '<div class="loading-notice">Unable to reach the vault. Retrying...</div>';
  });
}

// Initial fetch and 7s auto-sync
fetchLeaderboard();
setInterval(fetchLeaderboard, 7000);

// Check Player Session
const savedUser = localStorage.getItem("username");
const navUserLabel = document.getElementById("navUserLabel");
const navUserBtn = document.getElementById("navUserBtn");
if (savedUser) {
  if (navUserLabel) navUserLabel.textContent = savedUser.toUpperCase();
} else {
  if (navUserLabel) navUserLabel.textContent = "LOGIN";
  if (navUserBtn) navUserBtn.href = "/login";
}
