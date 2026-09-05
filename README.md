# Cookie Tap

An arcade-style competitive clicker web game built with Python (Flask) and vanilla HTML, CSS, and JavaScript.

Players tap a giant cookie to bake cookies, build combo multipliers, defend against thieves, send gifts to friends, and compete on a live global leaderboard.

---

## Features

- **Giant Cookie Arena**: Tap with your mouse or hit <kbd>Space</kbd> on the keyboard. Includes floating particle score feedback.
- **Deterministic Combo Multiplier**: Every 5 consecutive taps within 1.8 seconds increases your score multiplier by +1x (up to 10x max). Failing to tap within 1.8 seconds resets the combo back to 1x.
- **Thief Hazard Events**: When a player holds more than 40 cookies, thieves have a chance to spawn and march toward the cookie vault. Click the thief 3 times or press <kbd>D</kbd> to defend it for a +30 cookie bounty. If the thief reaches the vault, it steals 15% of your cookies (between 20 and 500) and resets your active combo.
- **My Cookie Vault & Session Telemetry**: Tracks your current safe balance with automatic 5-second server synchronization. Displays live session stats: Peak Combo, Total Taps, Thieves Foiled, and Gifts Sent.
- **Social Cookie Gifting**: Transfer cookies directly to any registered player by username. Includes quick increment chips (+10, +100, +500, MAX).
- **Live Leaderboard**: Displays player rankings sorted by total cookies. Automatically updated by a background server thread every 7 seconds.
- **Player Accounts & Memory Card**: Register, log in, change passwords, reset your cookie score to 0, or permanently delete your account. Unregistered players can play as guests with local storage.
- **Retro Arcade Cabinet Interface**: Styled after 1990s coin-op arcade machines with Odibee Sans typography, Cabinet Navy and neon palettes, sound effects for taps, buttons, and thief alerts, plus a background music toggle.

---

## Controls

| Key / Input | Action |
| :--- | :--- |
| **Left Click** / **Touch** | Tap cookie, click UI buttons, strike thief |
| <kbd>Space</kbd> | Tap the giant cookie |
| <kbd>D</kbd> | Strike incoming thief |
| <kbd>Esc</kbd> | Close account modal |

---

## Architecture & How It Works

The project runs on a single Flask application (`main.py`) on port `8080`:

1. **Authentication & Persistence**: User records (`username`, `password`, `cookie` count) are stored in `database.json`.
2. **Leaderboard Engine**: A background daemon thread periodically sorts player scores and saves the sorted rankings to `leaderboard.json` every 7 seconds.
3. **Client-Side State**: During gameplay, taps accumulate locally and automatically synchronize with the server every 5 seconds via `POST /sendCookies`.

For a detailed comparison of this version versus the original upstream Replit version, see [VERSION_DIFFERENCES.md](VERSION_DIFFERENCES.md).

---

## Project Structure

```text
cookie-tap/
├── main.py              # Flask server and route handlers
├── database.py          # SQLite persistence, password hashing, and cache
├── requirements.txt     # Python dependencies
├── DESIGN.md            # Design system tokens and UI rules
├── PRODUCT.md           # Product specification and game mechanics
├── VERSION_DIFFERENCES.md # Upstream vs. fork technical changelog
├── data/                # SQLite database and periodic JSON backups
│   ├── cookie_tap.db    # WAL-mode persistent database
│   └── backups/         # database.json and leaderboard.json backups
├── tests/               # Automated unit tests and concurrency suite
│   ├── test_api.py
│   └── test_concurrency.py
├── static/
│   ├── css/             # Arcade design system stylesheets
│   ├── js/              # Modular client scripts (game.js, index.js, etc.)
│   ├── audio/           # Sound effects and BGM audio assets
│   └── img/             # Sprites, icons, and logo graphics
├── templates/           # Clean markup templates
│   ├── index.html       # Landing page
│   ├── cookie.html      # Main cookie tap arena and control deck
│   ├── leaderboard.html # Live ranking table
│   ├── login.html       # Player sign-in
│   └── register.html    # Player registration
└── archive/             # Legacy backups (server2.py, cookie.js, etc.)
```

---

## Getting Started

### Prerequisites

- Python 3.10 or newer

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haikalthrq/Cookie-Tap-Remaster.git
   cd Cookie-Tap-Remaster
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (Command Prompt / PowerShell)
   python -m venv .venv
   .\.venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   python main.py
   ```

5. Open your browser and go to:
   ```text
   http://localhost:8080
   ```

6. Run automated test suite:
   ```bash
   python -m unittest discover tests
   ```

---

## Origin & Credits

This repository is an updated and standalone version of the original [cookie-tap](https://github.com/risal098/cookie-tap) project by [@risal098](https://github.com/risal098). The original project ran across two separate Replit services. This version merges the architecture into a single runnable local app, fixes client-server sync race conditions, updates the user interface, and adds game balance mechanics.

