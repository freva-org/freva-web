from pathlib import Path
import logging
from evaluation_system.api import plugin_manager as pm


def create_user_workdir(sender, user, request, **kwargs):
    # we don't want to create working dirs for guest users
    if user.isGuest():
        return

    freva_base_dir = Path(pm.config.get("base_dir_location"))
    user_home_dir = Path.joinpath(freva_base_dir, user.username)

    if not Path.exists(user_home_dir):
        try:
            user_home_dir.mkdir()
        except OSError as exc:
            logging.error(
                f"Couldn't create directory for user {user.username}: {str(exc)}"
            )
