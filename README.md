# Cookie Tap

An arcade clicker web game built with Python (Flask) and vanilla HTML, CSS, and JavaScript.

Live demo: [haikalthrq.pythonanywhere.com](https://haikalthrq.pythonanywhere.com)

---

## Features

- **Giant Cookie Arena**: Tap with a mouse, touch screen, or hit <kbd>Space</kbd> on the keyboard. Floating text confirms each score increment.
- **Combo Multiplier**: Every 5 consecutive taps within 1.8 seconds adds +1x to your multiplier, up to 10x. Waiting more than 1.8 seconds resets the multiplier to 1x.
- **Thief Hazard Events**: At 35+ cookies, thieves spawn and walk toward your stash. Strike the thief 3 times or press <kbd>D</kbd> to defend your vault and claim a 5% cookie bounty (30 to 2,500 cookies). If a thief reaches the cookie, it steals 15% of your stash (20 to 500 cookies) and breaks your combo. Thief speed and spawn frequency scale with your total cookies.
- **Vault and Session Telemetry**: Automatically synchronizes your cookie count with the server every 5 seconds. Tracks peak combo, total taps, thieves defeated, and gifts sent.
- **Cookie Gifting**: Transfer cookies to any registered player by username, with quick-select buttons (+10, +100, +500, MAX).
- **Live Leaderboard**: Displays player rankings sorted by total cookies, refreshed by a background thread every 7 seconds.
- **Accounts and Guest Mode**: Register to save progress across devices, change passwords, or delete your account. Unregistered players can play immediately as guests using local storage.
- **Arcade Interface & Audio**: Styled after 1990s coin-op cabinets with Odibee Sans and Inter typography, sound effects, background music, mute toggle, and full mobile support.

---

## Controls

| Key / Input | Action |
| :--- | :--- |
| **Left Click** / **Touch** | Tap cookie, press buttons, strike thief |
| <kbd>Space</kbd> | Tap the giant cookie |
| <kbd>D</kbd> | Strike incoming thief |
| <kbd>Esc</kbd> | Close account modal |

---

## Architecture

The application runs as a single Flask service:

1. **Storage and Security**: User accounts, passwords hashed with `scrypt`, and cookie balances are stored in SQLite (`data/cookie_tap.db`) with Write-Ahead Logging (WAL) and automatic JSON backup exports in `data/backups/`.
2. **Synchronization**: Player taps accumulate in client state and sync via `POST /sendCookies` every 5 seconds.
3. **Leaderboard**: An in-memory cache delivers sub-millisecond leaderboard reads, while a background daemon thread periodically updates rankings.

For technical differences between this version and the original Replit version, see [VERSION_DIFFERENCES.md](VERSION_DIFFERENCES.md).

---

## Project Structure

```text
cookie-tap/
├── main.py              # Flask server and route handlers
├── database.py          # SQLite persistence, password hashing, and cache
├── requirements.txt     # Python dependencies
├── VERSION_DIFFERENCES.md # Upstream vs. fork technical changelog
├── data/                # SQLite database and periodic JSON backups
│   ├── cookie_tap.db    # WAL-mode persistent database
│   └── backups/         # database.json and leaderboard.json backups
├── tests/               # Automated test suite
│   ├── test_api.py
│   └── test_concurrency.py
├── static/
│   ├── css/             # Stylesheets (arcade cabinet themes)
│   ├── js/              # Client scripts (game.js, auth.js, leaderboard.js)
│   ├── audio/           # Sound effects and background music
│   └── img/             # Sprites, icons, and logo assets
├── templates/           # Jinja2 HTML templates
│   ├── index.html       # Landing page
│   ├── cookie.html      # Game arena
│   ├── leaderboard.html # Live rankings
│   ├── login.html       # Sign-in page
│   └── register.html    # Account registration
└── archive/             # Upstream reference code (server2.py, cookie.js)
```

---

## Getting Started

### Prerequisites

- Python 3.10 or newer

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haikalthrq/cookie-tap.git
   cd cookie-tap
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell)
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

5. Open your browser:
   ```text
   http://localhost:8080
   ```

6. Run the test suite:
   ```bash
   python -m unittest discover tests
   ```

---

## Origin and Credits

This repository is a standalone rebuild of the original [cookie-tap](https://github.com/risal098/cookie-tap) by [@risal098](https://github.com/risal098). The original version ran across two separate Replit instances. This version unifies the architecture into a single server, replaces race-prone file reads with SQLite transactions, adds dynamic thief mechanics, and updates the interface for mobile and desktop screens.
