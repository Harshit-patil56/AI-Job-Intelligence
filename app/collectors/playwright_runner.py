"""Playwright safe execution runner for Windows and cross-platform environments.

Addresses the Windows asyncio limitation where SelectorEventLoop (used by Uvicorn --reload)
does not implement subprocess creation (_make_subprocess_transport raises NotImplementedError).
This runner transparently delegates Playwright async operations to a dedicated ProactorEventLoop
thread when running inside a SelectorEventLoop on Windows.
"""

import asyncio
import sys
from typing import Any, Callable, Coroutine, TypeVar

T = TypeVar("T")


async def run_safe_playwright(coro_fn: Callable[[], Coroutine[Any, Any, T]]) -> T:
    """Execute a Playwright coroutine safely regardless of the current event loop type.

    Args:
        coro_fn: A zero-argument callable returning a coroutine that uses Playwright.

    Returns:
        The return value of the coroutine.
    """
    loop = asyncio.get_running_loop()
    is_selector = sys.platform == "win32" and isinstance(
        loop, getattr(asyncio.windows_events, "_WindowsSelectorEventLoop", ())
    )

    if is_selector:
        def _thread_worker() -> T:
            proactor_loop = asyncio.windows_events.ProactorEventLoop()
            asyncio.set_event_loop(proactor_loop)
            try:
                return proactor_loop.run_until_complete(coro_fn())
            finally:
                proactor_loop.close()

        return await asyncio.to_thread(_thread_worker)

    return await coro_fn()
