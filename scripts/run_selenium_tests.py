#!/usr/bin/env python3

import json
import os
import signal
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


PORT = os.environ.get("PORT", "3000")
BASE_URL = os.environ.get("BASE_URL", f"http://localhost:{PORT}")
RESULTS_DIR = Path("tests/selenium/results")


class RecordingResult(unittest.TextTestResult):
    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.records = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.records.append(
            {
                "test": self.getDescription(test),
                "status": "passed",
                "details": "",
            }
        )

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.records.append(
            {
                "test": self.getDescription(test),
                "status": "failed",
                "details": self._exc_info_to_string(err, test),
            }
        )

    def addError(self, test, err):
        super().addError(test, err)
        self.records.append(
            {
                "test": self.getDescription(test),
                "status": "error",
                "details": self._exc_info_to_string(err, test),
            }
        )

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.records.append(
            {
                "test": self.getDescription(test),
                "status": "skipped",
                "details": reason,
            }
        )


def write_summary(result: RecordingResult, duration_seconds: float) -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    payload = {
        "generatedAt": generated_at,
        "baseUrl": BASE_URL,
        "browser": os.environ.get("SELENIUM_BROWSER", "chrome"),
        "headless": os.environ.get("HEADLESS", "true"),
        "durationSeconds": round(duration_seconds, 2),
        "total": result.testsRun,
        "failed": len(result.failures),
        "errors": len(result.errors),
        "skipped": len(result.skipped),
        "passed": result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped),
        "records": result.records,
    }

    (RESULTS_DIR / "selenium-summary.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )

    lines = [
        "# Selenium Test Summary",
        "",
        f"- Generated at: {generated_at}",
        f"- Base URL: {BASE_URL}",
        f"- Browser: {payload['browser']}",
        f"- Headless: {payload['headless']}",
        f"- Duration (s): {payload['durationSeconds']}",
        "",
        "## Totals",
        "",
        f"- Total: {payload['total']}",
        f"- Passed: {payload['passed']}",
        f"- Failed: {payload['failed']}",
        f"- Errors: {payload['errors']}",
        f"- Skipped: {payload['skipped']}",
        "",
        "## Details",
        "",
    ]

    for record in result.records:
        lines.append(f"- {record['status'].upper()} - {record['test']}")
        if record["details"]:
            lines.append("")
            lines.append("```text")
            lines.append(record["details"].strip())
            lines.append("```")
            lines.append("")

    (RESULTS_DIR / "selenium-summary.md").write_text(
        "\n".join(lines).strip() + "\n",
        encoding="utf-8",
    )


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


def is_server_ready(base_url: str) -> bool:
    try:
        with urllib.request.urlopen(f"{base_url}/api/ping", timeout=2) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError):
        return False


def main() -> int:
    env = os.environ.copy()
    env.setdefault("HEADLESS", "true")
    env.setdefault("SELENIUM_BROWSER", "chrome")
    env["BASE_URL"] = BASE_URL

    server = None
    started_server = False

    if not is_server_ready(BASE_URL):
        server = subprocess.Popen(
            ["npm", "run", "start", "--", "--port", PORT],
            env=env,
        )
        started_server = True

    def stop_server() -> None:
        if not started_server or server is None:
            return

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
        start_time = time.time()

        loader = unittest.TestLoader()
        suite = loader.discover(start_dir="tests/selenium", pattern="test_*.py", top_level_dir=".")
        runner = unittest.TextTestRunner(
            verbosity=2,
            resultclass=RecordingResult,
        )
        result = runner.run(suite)

        write_summary(result, time.time() - start_time)
        return 0 if result.wasSuccessful() else 1
    except Exception as error:  # noqa: BLE001
        print(error, file=sys.stderr)
        return 1
    finally:
        stop_server()


if __name__ == "__main__":
    raise SystemExit(main())
