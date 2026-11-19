"""Check a running deployment, including its frontend and generated previews."""

from __future__ import annotations

import argparse
import json
import re
import time
from urllib.error import URLError
from urllib.request import urlopen


def verify(base_url: str, wait_seconds: float = 0) -> dict[str, object]:
    base_url = base_url.rstrip("/")

    def fetch(path: str) -> bytes:
        with urlopen(base_url + path, timeout=10) as response:
            return response.read()

    deadline = time.monotonic() + wait_seconds
    while True:
        try:
            health = json.loads(fetch("/api/health"))
            if health.get("status") != "ok":
                raise ValueError("Health endpoint is not ready")
            break
        except (URLError, OSError, ValueError):
            if time.monotonic() >= deadline:
                raise
            time.sleep(min(2, max(0, deadline - time.monotonic())))

    palettes = json.loads(fetch("/api/palettes"))
    templates = json.loads(fetch("/api/templates"))
    if not palettes or not templates:
        raise ValueError("Palette or template catalog is empty")
    if health["palettes"] != len(palettes) or health["templates"] != len(templates):
        raise ValueError("Health counts do not match the catalogs")

    html = fetch("/")
    asset = re.search(rb'src="(/assets/[^"\s]+\.js)"', html)
    if b'<div id="root">' not in html or asset is None:
        raise ValueError("Built frontend is missing")
    if not fetch(asset.group(1).decode("utf-8")):
        raise ValueError("Frontend JavaScript is empty")

    preview = palettes[0]["previews"][0]
    if b"<svg" not in fetch(preview["svg_url"]):
        raise ValueError("Generated SVG preview is missing")
    if not fetch(preview["png_url"]).startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Generated PNG preview is missing")

    return {"status": "ok", "palettes": len(palettes), "templates": len(templates),
            "frontend": "ok", "svg": "ok", "png": "ok"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", nargs="?", default="http://127.0.0.1:8770")
    parser.add_argument("--wait", type=float, default=0, help="Seconds to wait for startup")
    arguments = parser.parse_args()
    print(json.dumps(verify(arguments.base_url, arguments.wait), ensure_ascii=False))
