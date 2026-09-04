from flask import Flask, request, render_template
import json
import threading
import time
import database

api = Flask(__name__)
api.config['TEMPLATES_AUTO_RELOAD'] = True


# ---------- Page Routing Below ---------- #
@api.route("/", methods=["GET"])
def landing_page():
    return render_template("index.html")


@api.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")


@api.route("/register", methods=["GET"])
def register_page():
    return render_template("register.html")


@api.route("/cookie", methods=["GET"])
def cookie_page():
    return render_template("cookie.html")


@api.route("/leaderboard", methods=["GET"])
def leaderboard_page():
    return render_template("leaderboard.html")


# ---------- API Operations Below ---------- #
@api.route("/registers", methods=["POST"])
def register():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        password = req["request"][1]
        res = database.register_user(username, password)
        return json.dumps({"respond": res})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/logins", methods=["POST"])
def login():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        password = req["request"][1]
        auth_ok, user = database.authenticate_user(username, password)
        if not auth_ok or not user:
            return json.dumps({"respond": "not found"})
        return json.dumps({"respond": user["cookie"]})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/sendCookies", methods=["POST"])
def send_cookies():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        # req["request"][1] is password (legacy compatibility)
        amount = req["request"][2]

        if not isinstance(amount, int):
            return "not now :)"
        if amount > 50000:
            amount = 50000

        new_balance = database.add_cookies(username, amount)
        if new_balance is None:
            return json.dumps({"respond": "not found"})
        return json.dumps({"respond": "succes", "cookies": new_balance})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/showCookies", methods=["POST"])
def show_cookies():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        user = database.get_user(username)
        if not user:
            return json.dumps({"respond": "not found"})
        return json.dumps({"respond": user["cookie"]})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/giveCookies", methods=["POST"])
def give_cookies():
    try:
        req = json.loads(request.data)
        sender = req["request"][0]
        amount = req["request"][1]
        target = req["request"][2]

        ok, result = database.transfer_cookies(sender, amount, target)
        if ok:
            return json.dumps({"respond": ["succes", result]})
        return json.dumps({"respond": "failed"})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/showLeaderboard", methods=["GET", "POST"])
def showLeaderboard():
    try:
        board = database.get_leaderboard()
        return json.dumps(board)
    except Exception as e:
        print("Show leaderboard error:", e)
        return json.dumps([])


@api.route("/changePassword", methods=["POST"])
def change_password():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        old_pass = req["request"][1]
        new_pass = req["request"][2]

        res = database.change_password(username, old_pass, new_pass)
        return json.dumps({"respond": res})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/changeUsername", methods=["POST"])
def change_username():
    try:
        req = json.loads(request.data)
        old_name = req["request"][0]
        password = req["request"][1]
        new_name = req["request"][2]

        res = database.change_username(old_name, password, new_name)
        if res == "succes":
            return json.dumps({"respond": "succes", "new_username": new_name})
        return json.dumps({"respond": res})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/resetScore", methods=["POST"])
def reset_score():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        password = req["request"][1]

        res = database.reset_score(username, password)
        return json.dumps({"respond": res})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


@api.route("/deleteAccount", methods=["POST"])
def delete_account():
    try:
        req = json.loads(request.data)
        username = req["request"][0]
        password = req["request"][1]

        res = database.delete_account(username, password)
        return json.dumps({"respond": res})
    except Exception as e:
        return json.dumps({"respond": "error", "message": str(e)})


def sync_worker():
    while True:
        time.sleep(10)
        if database.is_dirty():
            database.export_json_backup()


if __name__ == "__main__":
    database.init_db()
    t = threading.Thread(target=sync_worker, daemon=True)
    t.start()
    api.run(host="0.0.0.0", port=8080, debug=False)
