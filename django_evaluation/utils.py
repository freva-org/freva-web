"""Collection of utility functions."""

from __future__ import annotations

import threading
from typing import Any, Callable


def background(func: Callable[..., Any]) -> Callable[..., threading.Thread]:
    """Decorator for running a given function in the background.

    use @background to run a method in a seperate thread.
    """

    def call_func(*args: Any, **kwargs: Any) -> threading.Thread:
        """Call the function in a backround setting."""

        thread = threading.Thread(target=func, args=args, kwargs=kwargs)
        thread.start()
        return thread

    return call_func
