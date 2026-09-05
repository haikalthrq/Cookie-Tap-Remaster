// ==========================================
// Cookie Tap - Authentication Handlers
// ==========================================

const sfxButton = new Audio("/static/audio/button_tap.mp3");

function playBtnAudio() {
  sfxButton.currentTime = 0;
  sfxButton.play().catch(() => {});
}

function submitLogin() {
  playBtnAudio();
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const notice = document.getElementById("authNotice");
  const submitBtn = document.getElementById("submitBtn");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    notice.textContent = "Please fill in both username and password.";
    notice.className = "ds-notice error";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  const payload = JSON.stringify({ request: [username, password] });
  fetch('/logins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "LOGIN NOW";
    if (data.respond !== "not found") {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      localStorage.setItem("cookies", data.respond);
      notice.textContent = "Login successful! Entering vault...";
      notice.className = "ds-notice success";
      setTimeout(() => location.replace("/cookie"), 400);
    } else {
      notice.textContent = "Account not found or password incorrect. Please try again.";
      notice.className = "ds-notice error";
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "LOGIN NOW";
    notice.textContent = "Network error. Please try again.";
    notice.className = "ds-notice error";
    console.error(err);
  });
}

function submitRegister() {
  playBtnAudio();
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const notice = document.getElementById("authNotice");
  const submitBtn = document.getElementById("submitBtn");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    notice.textContent = "Please fill in both fields.";
    notice.className = "ds-notice error";
    return;
  }

  if (username.length > 15 || password.length > 15) {
    notice.textContent = "Username and password must not exceed 15 characters.";
    notice.className = "ds-notice error";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  const payload = JSON.stringify({ request: [username, password] });
  fetch('/registers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  })
  .then(res => res.json())
  .then(data => {
    submitBtn.disabled = false;
    submitBtn.textContent = "REGISTER ACCOUNT";
    if (data.respond === "succes") {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      localStorage.setItem("cookies", 0);
      notice.textContent = "Account created successfully! Entering cookie arena...";
      notice.className = "ds-notice success";
      setTimeout(() => location.replace("/cookie"), 400);
    } else if (data.respond === "existed") {
      notice.textContent = "Username already taken! Please choose another name.";
      notice.className = "ds-notice error";
    } else {
      notice.textContent = "Registration failed. Please try again.";
      notice.className = "ds-notice error";
    }
  })
  .catch(err => {
    submitBtn.disabled = false;
    submitBtn.textContent = "REGISTER ACCOUNT";
    notice.textContent = "Network error. Please try again.";
    notice.className = "ds-notice error";
    console.error(err);
  });
}
