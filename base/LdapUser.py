import os
from evaluation_system.model.db import UserDB
from evaluation_system.model.user import User
from base.exceptions import UserNotFoundError
from django_evaluation.ldaptools import get_ldap_object
from configparser import ConfigParser as Config, ExtendedInterpolation
from evaluation_system.misc import config


class LdapUser(User):
    """The freva evaluation system works with user accounts which are known to the underlying
    operating system. This is not necessarily true for the web interface as it can be started
    inside a Docker container without any access to a user directory. To bridge this gap
    the web interface has its own version of the `User` class which directly connects to the
    configured LDAP instead of asking the operating system for user information.
    """

    def __init__(self, username):
        ldap_object = get_ldap_object()
        user_info = ldap_object.get_user_info(username)
        if not user_info:
            raise UserNotFoundError()
        self._dir_type = config.get(config.DIRECTORY_STRUCTURE_TYPE)

        self._username = username
        self._uid = user_info[0]
        self._email = user_info[3]
        self._home_directory = user_info[4]
        self._userconfig = Config(interpolation=ExtendedInterpolation())
        # try to load the configuration from the very first time.
        self._userconfig.read(
            [
                User.EVAL_SYS_DEFAULT_CONFIG,
                os.path.join(self._home_directory, User.EVAL_SYS_CONFIG),
            ]
        )

        self._db = UserDB(self)

        row_id = self._db.getUserId(self.getName())
        if row_id:
            try:
                self._db.updateUserLogin(row_id, self._email)
            except:
                raise
        else:
            self._db.createUser(self.getName(), email=self._email)

    def getName(self):
        return self._username

    def getUserId(self):
        return self._uid

    def getUserHome(self):
        return self._home_directory

    def getEmail(self):
        return self._email

    def __str__(self):
        return (
            f"User: {self._username} Mail: {self._email} Home: {self._home_directory}"
        )
