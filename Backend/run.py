"""
Entry-point script for the backend server.
Run this from anywhere:
  python Backend/run.py
  python run.py  (if you're already inside Backend/)
"""
import sys
import os

# ── Make sure Python can find the `app` package regardless of CWD ──────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ── Also change CWD to Backend so .env is found by pydantic-settings ───────
os.chdir(BACKEND_DIR)

import uvicorn  # noqa: E402 (imported after sys.path patch)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[BACKEND_DIR],
    )
