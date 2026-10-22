"""Dev server launcher.

Usage:
    python scripts/run_server.py
    python scripts/run_server.py --host 0.0.0.0 --port 8080 --reload
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="run_server",
        description="AI Job Intelligence — ASGI development server",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="Enable hot-reload for development (default: off)",
    )
    parser.add_argument(
        "--log-level",
        default="info",
        choices=["critical", "error", "warning", "info", "debug", "trace"],
        help="Uvicorn log level",
    )
    args = parser.parse_args()

    uvicorn.run(
        "app.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        reload_dirs=[str(Path(__file__).resolve().parent.parent / "app")],
        log_level=args.log_level,
        loop="asyncio",
    )


if __name__ == "__main__":
    main()
