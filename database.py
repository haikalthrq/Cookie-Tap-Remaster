import sqlite3
import json
import os
import threading
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "cookie_tap.db")
JSON_DB_PATH = os.path.join(os.path.dirname(__file__), "database.json")
JSON_LB_PATH = os.path.join(os.path.dirname(__file__), "leaderboard.json")

_cache_lock = threading.Lock()
_leaderboard_cache = None
_is_dirty = False


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


def init_db():
    global _is_dirty
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE COLLATE NOCASE NOT NULL,
                password_hash TEXT NOT NULL,
                cookie INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_cookie ON users(cookie DESC);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE);")

        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as count FROM users;")
        count = cur.fetchone()["count"]

        # Auto-migrate legacy accounts from database.json if database is empty
        if count == 0 and os.path.exists(JSON_DB_PATH):
            try:
                with open(JSON_DB_PATH, "r", encoding="utf-8") as f:
                    legacy_data = json.load(f)
                accounts = legacy_data.get("account", [])
                for acc in accounts:
                    uname = str(acc.get("username", "")).strip()
                    passwd = str(acc.get("password", ""))
                    ck = acc.get("cookie", 0)
                    if not isinstance(ck, int):
                        ck = 0
                    if uname:
                        # Store existing plaintext passwords directly; they will be
                        # transparently upgraded to secure hashes upon first login
                        conn.execute(
                            "INSERT OR IGNORE INTO users (username, password_hash, cookie) VALUES (?, ?, ?);",
                            (uname, passwd, max(0, ck))
                        )
                _is_dirty = True
                print(f"[Database] Migrated {len(accounts)} accounts from database.json to SQLite.")
            except Exception as e:
                print(f"[Database] Legacy migration error: {e}")


def mark_dirty():
    global _is_dirty, _leaderboard_cache
    with _cache_lock:
        _is_dirty = True
        _leaderboard_cache = None


def is_dirty():
    global _is_dirty
    with _cache_lock:
        return _is_dirty


def get_user(username):
    target = str(username).strip()
    if not target:
        return None
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, username, password_hash, cookie FROM users WHERE username = ? COLLATE NOCASE;", (target,))
        row = cur.fetchone()
        if row:
            return dict(row)
    return None


def register_user(username, password):
    uname = str(username).strip()
    passwd = str(password).strip()

    if not uname or not passwd or len(uname) > 20:
        return "invalid_format"

    hashed = generate_password_hash(passwd)
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO users (username, password_hash, cookie) VALUES (?, ?, 0);",
                (uname, hashed)
            )
        mark_dirty()
        return "succes"
    except sqlite3.IntegrityError:
        return "existed"
    except Exception as e:
        print("Register error:", e)
        return "error"


def authenticate_user(username, password):
    user = get_user(username)
    if not user:
        return False, None

    stored_hash = user["password_hash"]
    pwd_str = str(password)

    # 1. Try standard secure hash verification
    if check_password_hash(stored_hash, pwd_str):
        return True, user

    # 2. Transparent migration for legacy plaintext passwords
    if stored_hash == pwd_str:
        new_hash = generate_password_hash(pwd_str)
        try:
            with get_db() as conn:
                conn.execute("UPDATE users SET password_hash = ? WHERE id = ?;", (new_hash, user["id"]))
            user["password_hash"] = new_hash
        except Exception as e:
            print("Password upgrade error:", e)
        return True, user

    return False, None


def add_cookies(username, amount):
    uname = str(username).strip()
    if not uname:
        return None
    try:
        delta = int(amount)
    except (ValueError, TypeError):
        return None

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET cookie = MAX(0, cookie + ?) WHERE username = ? COLLATE NOCASE RETURNING cookie;",
            (delta, uname)
        )
        row = cur.fetchone()
        if row:
            mark_dirty()
            return row["cookie"]
    return None


def transfer_cookies(sender_username, amount, target_username, sender_password=None):
    s_name = str(sender_username).strip()
    t_name = str(target_username).strip()

    if not s_name or not t_name or s_name.lower() == t_name.lower():
        return False, "invalid_transfer"

    try:
        qty = int(amount)
        if qty <= 0:
            return False, "invalid_amount"
    except (ValueError, TypeError):
        return False, "invalid_amount"

    # Optional password verification for sender if provided
    if sender_password is not None:
        auth_ok, _ = authenticate_user(s_name, sender_password)
        if not auth_ok:
            return False, "invalid_credentials"

    with get_db() as conn:
        cur = conn.cursor()
        # Verify sender exists and has enough cookies
        cur.execute("SELECT id, cookie FROM users WHERE username = ? COLLATE NOCASE;", (s_name,))
        sender = cur.fetchone()
        if not sender or sender["cookie"] < qty:
            return False, "insufficient_balance"

        # Verify target user exists
        cur.execute("SELECT id FROM users WHERE username = ? COLLATE NOCASE;", (t_name,))
        target = cur.fetchone()
        if not target:
            return False, "recipient_not_found"

        # Atomic transaction: debit sender, credit recipient
        cur.execute("UPDATE users SET cookie = cookie - ? WHERE id = ?;", (qty, sender["id"]))
        cur.execute("UPDATE users SET cookie = cookie + ? WHERE id = ?;", (qty, target["id"]))
        new_sender_cookie = sender["cookie"] - qty

    mark_dirty()
    return True, new_sender_cookie


def change_password(username, old_password, new_password):
    uname = str(username).strip()
    new_pass = str(new_password).strip()

    if not new_pass or len(new_pass) > 25:
        return "invalid_format"

    auth_ok, user = authenticate_user(uname, old_password)
    if not auth_ok:
        return "invalid_credentials"

    new_hash = generate_password_hash(new_pass)
    with get_db() as conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?;", (new_hash, user["id"]))
    return "succes"


def change_username(old_username, password, new_username):
    old_u = str(old_username).strip()
    new_u = str(new_username).strip()

    if not new_u or len(new_u) > 20:
        return "invalid_format"

    auth_ok, user = authenticate_user(old_u, password)
    if not auth_ok:
        return "invalid_credentials"

    try:
        with get_db() as conn:
            conn.execute("UPDATE users SET username = ? WHERE id = ?;", (new_u, user["id"]))
        mark_dirty()
        return "succes"
    except sqlite3.IntegrityError:
        return "existed"
    except Exception as e:
        print("Change username error:", e)
        return "error"


def reset_score(username, password):
    uname = str(username).strip()
    auth_ok, user = authenticate_user(uname, password)
    if not auth_ok:
        return "invalid_credentials"

    with get_db() as conn:
        conn.execute("UPDATE users SET cookie = 0 WHERE id = ?;", (user["id"],))
    mark_dirty()
    return "succes"


def delete_account(username, password):
    uname = str(username).strip()
    auth_ok, user = authenticate_user(uname, password)
    if not auth_ok:
        return "invalid_credentials"

    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE id = ?;", (user["id"],))
    mark_dirty()
    return "succes"


def get_leaderboard(limit=100):
    global _leaderboard_cache
    with _cache_lock:
        if _leaderboard_cache is not None:
            return _leaderboard_cache

        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT cookie, username FROM users WHERE cookie >= 0 ORDER BY cookie DESC, id ASC LIMIT ?;",
                (limit,)
            )
            rows = cur.fetchall()
            _leaderboard_cache = [[row["cookie"], row["username"]] for row in rows]
            return _leaderboard_cache


def export_json_backup():
    global _is_dirty
    with _cache_lock:
        if not _is_dirty:
            return
        _is_dirty = False

    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT username, password_hash, cookie FROM users ORDER BY id ASC;")
            users = [
                {"username": r["username"], "password": r["password_hash"], "cookie": r["cookie"]}
                for r in cur.fetchall()
            ]
            cur.execute("SELECT cookie, username FROM users WHERE cookie >= 0 ORDER BY cookie DESC, id ASC;")
            board = [[r["cookie"], r["username"]] for r in cur.fetchall()]

        tmp_db = JSON_DB_PATH + ".tmp"
        with open(tmp_db, "w", encoding="utf-8") as f:
            json.dump({"account": users}, f)
        os.replace(tmp_db, JSON_DB_PATH)

        tmp_lb = JSON_LB_PATH + ".tmp"
        with open(tmp_lb, "w", encoding="utf-8") as f:
            json.dump(board, f)
        os.replace(tmp_lb, JSON_LB_PATH)
    except Exception as e:
        print("[Database Backup] Export error:", e)
