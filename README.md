# Cookie Tap

An arcade clicker web game built with Python (Flask) and vanilla JavaScript, HTML, and CSS.

Live demo: https://haikalthrq.pythonanywhere.com

Players tap a giant cookie to bake cookies, build combo multipliers, defend against thieves, send cookies to friends, and compete on a live global leaderboard.

---

## Features

- **Giant Cookie Arena**: Tap with a mouse, touch screen, or hit Spacebar. Includes tactile click feedback and floating score particles.
- **Deterministic Combo Multiplier**: Consecutive taps within 1.8 seconds increase the score multiplier up to 10x. Missing the 1.8-second window resets the combo back to 1x.
- **Dynamic Thief Hazards**: Stashing 35 or more cookies attracts thieves. Defeating a thief takes 3 clicks or pressing <kbd>D</kbd>, awarding a 5% cookie bounty (30 to 2,500 cookies). If a thief reaches the vault, it steals 15% of your stash (20 to 500 cookies) and breaks your active combo.
- **Dynamic Difficulty Scaling**: Thief arrival intervals and movement speed scale with your cookie count. High baking combos also provoke thieves to appear sooner. Movement speed has a hard cap so defense remains winnable for human reflexes.
- **Cookie Vault and Session Telemetry**: Synchronizes local taps with the server every 5 seconds. Displays live session stats: Peak Combo, Total Taps, Thieves Foiled, and Gifts Sent.
- **Social Cookie Gifting**: Transfer cookies directly to any registered player by username with quick increment chips (+10, +100, +500, MAX).
- **Live Leaderboard**: Displays player rankings sorted by total cookies. Automatically updated by a background server thread every 7 seconds.
- **Player Accounts and Guest Mode**: Register, log in, change passwords, reset cookie scores, or permanently delete an account. Unregistered players can play as guests with browser storage.
- **Retro Arcade Presentation**: Styled after 1990s coin-op arcade cabinets with Odibee Sans typography, Cabinet Navy and neon palettes, sound effects for taps, buttons, and thief alerts, plus a background music toggle.

---

## Controls

| Key / Input | Action |
| :--- | :--- |
| **Left Click** / **Touch** | Tap cookie, click UI buttons, strike thief |
| <kbd>Space</kbd> | Tap the giant cookie |
| <kbd>D</kbd> | Strike incoming thief |
| <kbd>Esc</kbd> | Close account modal |

---

## Architecture

The project runs on a single Flask application (`main.py`):

1. **Storage and Persistence (`database.py`)**: Stores user accounts and scores in a SQLite database (`data/cookie_tap.db`) configured with write-ahead logging (WAL) and password hashing (`scrypt`). Exports periodic JSON backups to `data/backups/`.
2. **Leaderboard Engine**: A background thread sorts player scores and refreshes the ranking table every 7 seconds.
3. **Client-Server Sync (`static/js/game.js`)**: Taps accumulate locally and batch sync to `/sendCookies` every 5 seconds, keeping gameplay responsive even on slower connections.

For a technical comparison with the original Replit upstream version, see [VERSION_DIFFERENCES.md](VERSION_DIFFERENCES.md).

---

## Project Structure

```text
cookie-tap/
├── main.py              # Flask server and route handlers
├── database.py          # SQLite persistence, password hashing, and cache
├── requirements.txt     # Python dependencies
├── LICENSE              # MIT license
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

## Origin and Credits

This repository is an updated standalone version of the original [cookie-tap](https://github.com/risal098/cookie-tap) project by [@risal098](https://github.com/risal098). The original ran across two separate Replit services. This fork consolidates the architecture into a single runnable app, fixes race conditions during client-server synchronization, updates the user interface, and adds dynamic thief hazard scaling.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

