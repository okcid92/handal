#!/usr/bin/env python3

import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request


PORT = os.environ.get("PORT", "3000")
BASE_URL = os.environ.get("BASE_URL", f"http://127.0.0.1:{PORT}")


def wait_for_server(base_url: str, timeout_seconds: int = 120) -> None:
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{base_url}/api/ping", timeout=2) as response:
                if response.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            pass

        time.sleep(1)

    raise RuntimeError(f"Timed out waiting for Next.js at {base_url}")


def main() -> int:
    env = os.environ.copy()
    env.setdefault("HEADLESS", "true")
    env.setdefault("SELENIUM_BROWSER", "chrome")
    env["BASE_URL"] = BASE_URL

    server = subprocess.Popen(
        ["npm", "run", "start", "--", "--port", PORT],
        env=env,
    )

    def stop_server() -> None:
        if server.poll() is None:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()

    def handle_signal(sig, frame):
        del frame
        stop_server()
        if sig == signal.SIGINT:
            raise SystemExit(130)
        raise SystemExit(143)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        wait_for_server(BASE_URL)
        test_process = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", "tests/selenium", "-p", "test_*.py"],
            env=env,
            check=False,
        )
        return test_process.returncode
    except Exception as error:  # noqa: BLE001
        print(error, file=sys.stderr)
        return 1
    finally:
        stop_server()


if __name__ == "__main__":
    raise SystemExit(main())
