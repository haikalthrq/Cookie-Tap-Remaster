# Version Differences: Cookie Tap (Original vs. Fork)

This document provides a technical comparison between the original upstream repository ([cookie-tap](https://github.com/risal098/cookie-tap) by [@risal098](https://github.com/risal098)) and this fork.

---

## 1. Background

The original project was built for Replit using two separate Replit instances. Over time, several issues made the original code unrunnable:

1. The old Replit domains (`https://cookie-1.risalahqz.repl.co` and `https://cookie-2.risalahqz.repl.co`) are offline.
2. Hardcoded domain URLs in frontend scripts prevented the app from working in any other environment.
3. Running two separate servers complicated local testing and deployment.

This fork unifies the codebase into a single-server application that runs locally without external dependencies.

---

## 2. Architecture Comparison

| Parameter | Original (Upstream) | Current Fork |
| :--- | :--- | :--- |
| **Architecture Model** | Dual-server setup | Standalone single-server |
| **Process Count** | 2 processes required (`main.py` + `server2.py`) | 1 process (`main.py` handles game and leaderboard) |
| **Frontend Routing** | Hardcoded absolute URLs (`https://*.repl.co`) | Relative paths (`/login`, `/registers`, `/sendCookies`, etc.) |
| **Dependency Management** | None (`requirements.txt` missing) | Standard `requirements.txt` with virtual environment support |
| **Leaderboard Updates** | Periodic HTTP POST from Server 1 to Server 2 | Internal daemon thread writing directly to `leaderboard.json` |
| **Portability** | Locked to Replit | Runs on `localhost`, private networks, containers, or VPS |

---

## 3. Changes by File

### Dependencies & Environment

- **Added `requirements.txt`**:
  - `Flask` (3.1.3)
  - `Flask-CORS` (6.0.5)
  - `requests` (2.34.2)
- Added `.venv` support to isolate dependencies from the global Python environment.

---

### Backend (`main.py`)

- **Merged Leaderboard Sorting**: Integrated the `sortBoard(data)` function from `server2.py` directly into `main.py`.
- **Background Thread**: In the original version, `sendLeaderboard()` sent an HTTP POST request to Server 2 every 7 seconds. In this fork, `updateLeaderboard()` sorts accounts from `database.json` and writes them directly to `leaderboard.json`. The thread runs with `daemon=True` so it exits cleanly when the server stops.
- **Route `/showLeaderboard`**: Updated to support both GET and POST requests, serving data directly from local `leaderboard.json`.
- **Entry Point**: Added standard `if __name__ == '__main__':` block running on `0.0.0.0:8080`.

---

### Frontend Templates

#### 1. `templates/index.html`
- Replaced all `https://cookie-1.risalahqz.repl.co` links with relative paths (`/`, `/leaderboard`, `/register`, `/login`).
- Updated form action attributes to relative endpoints.

#### 2. `templates/login.html`
- Replaced header links with `/` and `/leaderboard`.
- Changed `fetch('https://cookie-1.risalahqz.repl.co/logins')` to `fetch('/logins')`.
- Changed login redirect target to `/cookie`.

#### 3. `templates/register.html`
- Replaced header links with `/` and `/leaderboard`.
- Changed `fetch('https://cookie-1.risalahqz.repl.co/registers')` to `fetch('/registers')`.
- Changed post-registration redirect target to `/`.

#### 4. `templates/cookie.html` (Game Arena)
- Replaced header navigation with relative URLs.
- Changed `giveCookies` fetch call to `/giveCookies`.
- Changed `sendCookies` (tap synchronization and thief penalties) fetch call to `/sendCookies`.
- Changed `showCookies` fetch call to `/showCookies`.

#### 5. `templates/leaderboard.html`
- Replaced logo link with `/`.
- Changed leaderboard data fetch call from `https://cookie-2.risalahqz.repl.co/showLeaderboard` to `/showLeaderboard`.

---

### Secondary Server (`server2.py`)

- Retained in the repository for historical reference. It does not need to be run. All leaderboard calculations now run inside `main.py`.

---

## 4. Running Locally

### Prerequisites

- Python 3.10 or newer

### Setup Steps

1. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .\.venv\Scripts\activate

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:
   ```bash
   python main.py
   ```

4. Open the application in your browser:
   ```text
   http://localhost:8080
   ```
