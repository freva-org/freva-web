"""Collection of utility functions."""

from __future__ import annotations

import json
import threading
import time
from typing import Any, Callable

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils.safestring import mark_safe


def background(func: Callable[..., Any]) -> Callable[..., threading.Thread]:
    """Decorator for running a given function in the background.

    use @background to run a method in a seperate thread.
    """

    def call_func(*args: Any, **kwargs: Any) -> threading.Thread:
        """Call the function in a backround setting."""

        thread = threading.Thread(target=func, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()
        return thread

    return call_func


@background
def sync_mail_users(refresh_itervall: int = 3600, oneshot: bool = False) -> None:
    """Synchronise all users with an email address in the background."""
    user_model = get_user_model()
    while True:
        user_info = [
            {
                "id": u.username,
                "text": f"{u.first_name}, {u.last_name} ({u.email})",
            }
            for u in user_model.objects.exclude(email__exact="").exclude(
                email__isnull=True
            )
        ]
        cache.set(
            "user_email_info", mark_safe(json.dumps(user_info)), refresh_itervall + 10
        )
        if oneshot is True:
            break
        time.sleep(refresh_itervall)
