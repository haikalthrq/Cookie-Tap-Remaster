import unittest
import threading
import json
import time
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import api
import database


class CookieTapConcurrencyTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()
        cls.client = api.test_client()

    def test_30_thread_stress_concurrency(self):
        """Simulate 30 concurrent threads performing taps and cookie transfers."""
        u_a = "concur_pilot_a"
        u_b = "concur_pilot_b"

        with database.get_db() as conn:
            conn.execute("DELETE FROM users WHERE username IN (?, ?);", (u_a, u_b))

        database.register_user(u_a, "passA")
        database.register_user(u_b, "passB")
        database.add_cookies(u_a, 1000)
        database.add_cookies(u_b, 1000)

        errors = []

        def worker_tap(user, taps):
            try:
                r = self.client.post("/sendCookies", data=json.dumps({"request": [user, "pass", taps]}), content_type="application/json")
                d = json.loads(r.data)
                if d.get("respond") != "succes":
                    errors.append(f"Tap error: {d}")
            except Exception as e:
                errors.append(str(e))

        def worker_transfer(sender, target, qty):
            try:
                r = self.client.post("/giveCookies", data=json.dumps({"request": [sender, qty, target]}), content_type="application/json")
                d = json.loads(r.data)
                if not d.get("respond") or d["respond"][0] != "succes":
                    errors.append(f"Transfer error: {d}")
            except Exception as e:
                errors.append(str(e))

        threads = []
        # 20 threads tapping
        for _ in range(10):
            threads.append(threading.Thread(target=worker_tap, args=(u_a, 10)))
            threads.append(threading.Thread(target=worker_tap, args=(u_b, 10)))

        # 10 threads transferring back and forth
        for _ in range(5):
            threads.append(threading.Thread(target=worker_transfer, args=(u_a, u_b, 25)))
            threads.append(threading.Thread(target=worker_transfer, args=(u_b, u_a, 25)))

        t0 = time.perf_counter()
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        t1 = time.perf_counter()

        self.assertEqual(len(errors), 0, f"Concurrency errors: {errors}")

        final_a = database.get_user(u_a)["cookie"]
        final_b = database.get_user(u_b)["cookie"]

        # Math: 1000 + 10*10 = 1100 each (transfers cancelled each other out: 5*25 - 5*25 = 0)
        self.assertEqual(final_a, 1100, f"Expected 1100 for u_a, got {final_a}")
        self.assertEqual(final_b, 1100, f"Expected 1100 for u_b, got {final_b}")

        # Cleanup
        with database.get_db() as conn:
            conn.execute("DELETE FROM users WHERE username IN (?, ?);", (u_a, u_b))

        print(f"\n  [PASS] 30 concurrent threads completed in {(t1 - t0)*1000:.2f} ms without errors.")


if __name__ == "__main__":
    unittest.main()
