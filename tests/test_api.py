import unittest
import json
import time
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import api
import database


class CookieTapAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()
        cls.client = api.test_client()

    def test_01_page_routes(self):
        """Verify all HTML template pages render with 200 OK."""
        routes = ["/", "/login", "/register", "/cookie", "/leaderboard"]
        for route in routes:
            with self.subTest(route=route):
                res = self.client.get(route)
                self.assertEqual(res.status_code, 200, f"Route {route} failed")
                # Ensure correct script / css references exist
                html = res.data.decode("utf-8")
                self.assertIn("static/css/", html)

    def test_02_static_assets(self):
        """Verify reorganized static files (CSS, JS, Audio, Images) resolve correctly."""
        assets = [
            "/static/css/style-cookie.css",
            "/static/css/style-index.css",
            "/static/css/style-leaderboard.css",
            "/static/css/style-log.css",
            "/static/css/style-reg.css",
            "/static/js/game.js",
            "/static/js/index.js",
            "/static/js/leaderboard.js",
            "/static/js/auth.js",
            "/static/audio/cookie_tap.mp3",
            "/static/audio/button_tap.mp3",
            "/static/audio/cookie_theme.mp3",
            "/static/img/pngegg.png",
            "/static/img/thief.png",
        ]
        for asset in assets:
            with self.subTest(asset=asset):
                res = self.client.get(asset)
                self.assertEqual(res.status_code, 200, f"Asset {asset} returned {res.status_code}")
                res.close()

    def test_03_registration_and_authentication(self):
        """Test registration, duplicate prevention, and login credentials verification."""
        test_u = "test_api_pilot"
        test_p = "VaultKey#99"

        # Cleanup test user if left over
        with database.get_db() as conn:
            conn.execute("DELETE FROM users WHERE username = ?;", (test_u,))

        # Registration
        res = self.client.post("/registers", data=json.dumps({"request": [test_u, test_p]}), content_type="application/json")
        data = json.loads(res.data)
        self.assertEqual(data.get("respond"), "succes")

        # Duplicate Registration
        res_dup = self.client.post("/registers", data=json.dumps({"request": [test_u, test_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_dup.data).get("respond"), "existed")

        # Valid Login
        res_login = self.client.post("/logins", data=json.dumps({"request": [test_u, test_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_login.data).get("respond"), 0)

        # Invalid Login
        res_invalid = self.client.post("/logins", data=json.dumps({"request": [test_u, "WrongPassword"]}), content_type="application/json")
        self.assertEqual(json.loads(res_invalid.data).get("respond"), "not found")

    def test_04_tap_synchronization(self):
        """Test single-roundtrip /sendCookies returns new balance."""
        test_u = "test_api_pilot"
        test_p = "VaultKey#99"

        res = self.client.post("/sendCookies", data=json.dumps({"request": [test_u, test_p, 50]}), content_type="application/json")
        data = json.loads(res.data)
        self.assertEqual(data.get("respond"), "succes")
        self.assertEqual(data.get("cookies"), 50)

        # Show cookies check
        res_show = self.client.post("/showCookies", data=json.dumps({"request": [test_u, test_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_show.data).get("respond"), 50)

    def test_05_social_gifting(self):
        """Test atomic cookie transfer between users."""
        test_u = "test_api_pilot"
        recipient = "haikalthrq"

        recip_before = database.get_user(recipient)["cookie"]
        res = self.client.post("/giveCookies", data=json.dumps({"request": [test_u, 20, recipient]}), content_type="application/json")
        data = json.loads(res.data)
        self.assertEqual(data.get("respond")[0], "succes")
        self.assertEqual(data.get("respond")[1], 30)

        recip_after = database.get_user(recipient)["cookie"]
        self.assertEqual(recip_after, recip_before + 20)

        # Revert gift balance
        database.add_cookies(recipient, -20)
        database.add_cookies(test_u, 20)

    def test_06_leaderboard_cache(self):
        """Test sub-millisecond in-memory leaderboard."""
        t0 = time.perf_counter()
        res = self.client.get("/showLeaderboard")
        t1 = time.perf_counter()
        self.assertEqual(res.status_code, 200)
        lb = json.loads(res.data)
        self.assertIsInstance(lb, list)
        self.assertGreater(len(lb), 0)
        # Latency check: should be fast in-memory response (< 50ms)
        self.assertLess((t1 - t0) * 1000, 50)

    def test_07_account_lifecycle(self):
        """Test change password, change username, reset score, and account deletion."""
        test_u = "test_api_pilot"
        test_p = "VaultKey#99"
        new_u = "test_api_renamed"
        new_p = "BrandNewKey#123"

        # Change username
        res_u = self.client.post("/changeUsername", data=json.dumps({"request": [test_u, test_p, new_u]}), content_type="application/json")
        self.assertEqual(json.loads(res_u.data).get("respond"), "succes")

        # Change password
        res_p = self.client.post("/changePassword", data=json.dumps({"request": [new_u, test_p, new_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_p.data).get("respond"), "succes")

        # Reset score
        res_r = self.client.post("/resetScore", data=json.dumps({"request": [new_u, new_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_r.data).get("respond"), "succes")
        self.assertEqual(database.get_user(new_u)["cookie"], 0)

        # Delete account
        res_d = self.client.post("/deleteAccount", data=json.dumps({"request": [new_u, new_p]}), content_type="application/json")
        self.assertEqual(json.loads(res_d.data).get("respond"), "succes")
        self.assertIsNone(database.get_user(new_u))

    def test_08_json_backup_export(self):
        """Test backup export to data/backups/."""
        database.export_json_backup()
        self.assertTrue(os.path.exists(database.JSON_DB_PATH))
        self.assertTrue(os.path.exists(database.JSON_LB_PATH))


if __name__ == "__main__":
    unittest.main()
