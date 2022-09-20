from __future__ import annotations
from abc import ABCMeta, abstractmethod
import importlib
import time
from typing import Iterator

from django_evaluation import settings
from django_evaluation.utils import background
from django.core.cache import cache, caches
from django.core.exceptions import ImproperlyConfigured
import ldap
import grp
import pwd

"""
FIXME: 28.03.2022
As of now only the `MiklipUserInformation` (which is basically a DKRZ-User) is working
properly as it has `home-directory` as an additional information.

The whole file needs refactoring.
"""


class LdapUserInformation(object):
    __metaclass__ = ABCMeta
    _con = None
    miklip_user = []
    user_info = []
    user_info_dict = {}
    _user_ids = set()

    @staticmethod
    def _establish_ldap_connection():
        for SERVER in settings.AUTH_LDAP_SERVER_URI.split(","):
            if not settings.AUTH_LDAP_START_TLS:
                ldap.set_option(
                    ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER
                )
            try:
                con = ldap.initialize(SERVER)
            except ldap.LDAPError as e:
                error = e
                continue
            try:
                con.start_tls_s()
            except ldap.CONNECT_ERROR as e:
                error = e
                continue
            return con
        raise error

    def _connect_to_ldap(self):
        """
        Establish ldap connection, use django settings
        """
        if self._con:
            return self._con
        # whenever a CA_CERTDIR is set use it.
        try:
            ldap.set_option(ldap.OPT_X_TLS_CACERTDIR, settings.CA_CERT_DIR)
        except:
            pass
        con = self._establish_ldap_connection()
        # bind with the simple user
        try:
            con.simple_bind_s(settings.LDAP_USER_DN, settings.LDAP_USER_PW)
        except (ValueError, AttributeError, ldap.INVALID_CREDENTIALS):
            # Try to connect without credentials
            con.simple_bind_s()
        self._con = con
        return self._con

    @staticmethod
    def merge_member(
        search_results: list[tuple[str, dict[str, list[bytes | str]]]],
        key: str,
    ) -> Iterator[str]:
        """Merge the group member from a ldap search result into a list.

        Parameters
        ----------
        search_results: list[tuple[str, dict[str, list[bytes]]]]
            The ldap query results
        key:
            The search key representing the member in the ldap search query.

        Yields
        -------
        str: of search results representing the members
        """
        _user_ids = set()
        for result in search_results:
            for member in result[1].get(key, []):
                if isinstance(member, str):
                    uid = member
                else:
                    uid = member.decode()
                if uid not in _user_ids:
                    _user_ids.add(uid)
                    yield uid

    @background
    def run_ldap_cacheing_daemon(self, refresh_interval: int = 3600) -> None:
        """Reload the ldap information every `refresh_interval` seconds.

        Parameters
        ----------
        refresh_interval: int
            Number of seconds to wait before the ldap information is refreshed.
        """
        while True:
            self._cache_ldap_users()
            time.sleep(refresh_interval)

    def _cache_ldap_users(self):
        if not self.user_info:
            caches["default"]
            self.user_info = cache.get("LDAP_user_info", [])
            if not self.user_info:
                self.load_from_ldap()
                cache.set("LDAP_user_info", self.user_info, 3600)

    @abstractmethod
    def load_from_ldap(self):
        pass

    def get_user_info(self, uid=None):
        """
        Returns the user info and loads it whenever necessary
        """
        self._cache_ldap_users()

        if uid:
            if not self.user_info_dict:
                caches["default"]
                self.user_info_dict = cache.get("LDAP_user_info_dict", {})
                if not self.user_info_dict:
                    for user in self.user_info:
                        self.user_info_dict[user[0]] = user
                    cache.set("LDAP_user_info_dict", self.user_info_dict, 3600)
            return self.user_info_dict.get(uid, None)
        return None

    def get_all_users(self):
        self._cache_ldap_users()
        return self.user_info

    @property
    def connection(self):
        return self._connect_to_ldap()

    def __del__(self, *args, **kwargs):
        if self._con:
            self._con.unbind_s()


class FUUserInformation(LdapUserInformation):
    ldap_keys = ["uid", "mail", "cn", "homeDirectory", "gecos"]

    def load_from_ldap(self):
        # search all users belonging
        con = self.connection
        res = con.search_s(
            settings.LDAP_GROUP_BASE,
            ldap.SCOPE_SUBTREE,
            attrlist=["memberUid"],
            filterstr=settings.LDAP_GROUP_FILTER,
        )

        self.miklip_user = []
        user_info = []
        # fill the users list
        for uid in self.merge_member(res, "memberUid"):
            res = con.search_s(
                settings.LDAP_USER_BASE,
                ldap.SCOPE_SUBTREE,
                attrlist=self.ldap_keys,
                filterstr=f"uid={uid}",
            )
            res_str = {k: v[0].decode() for (k, v) in res[0][1].items()}

            uid = res_str["uid"]
            name = res_str["cn"].split(" ")
            try:
                prename = name[1]
            except:
                prename = ""
            try:
                lastname = name[0]
            except:
                lastname = ""
            mail = res_str.get("mail")
            gecos = res_str.get("gecos")
            home_dir = res_str.get("homeDirectory")

            if mail:
                email = mail
                user_info.append((uid, prename, lastname, email, home_dir))
            elif gecos:
                tmp = gecos.split(",")
                for val in tmp:
                    if "@" in val:
                        email = val
                        user_info.append(
                            (uid, prename, lastname, email, home_dir)
                        )
                        break

        self.user_info = sorted(
            self.user_info + user_info, key=lambda tup: tup[1]
        )
        return self.user_info


class DWDUserInformation(LdapUserInformation):
    """
    A classt to get additional User information at DWD
    """

    def load_from_ldap(self):
        # search all users belonging
        con = self.connection
        res = con.search_s(
            settings.LDAP_GROUP_BASE, ldap.SCOPE_SUBTREE, "objectClass=Person"
        )
        self.miklip_user = []
        user_info = []
        user_list = res

        # fill the users list
        for user in user_list:
            uid = user[1].get("uid", [None])[0]
            lastname = user[1].get("sn", [None])[0]
            prename = user[1].get("givenName", [None])[0]
            mail = user[1].get("dwdmailRoutingAddress", [None])[0]

            if mail and uid:
                user_info.append((uid, lastname, prename, mail))

        self.user_info = sorted(user_info, key=lambda tup: tup[1])
        return self.user_info


class MiklipUserInformation(LdapUserInformation):
    """
    A class to access additional LDAP information using the
    agent user and no binding with the logged in user
    """

    ldap_keys = [
        "sn",
        "givenName",
        "uid",
        "mail",
        "mailForwardingAddress",
        "homeDirectory",
    ]

    def load_from_ldap(self):
        """
        Loads the miklip user ids and the info belonging to the user
        """
        users = (
            self.connection.search_s(
                settings.LDAP_GROUP_BASE,
                ldap.SCOPE_SUBTREE,
                attrlist=self.ldap_keys,
            )
            or []
        )
        self.miklip_user = []
        user_info_dict = {}
        all_users = set()
        user_info = set()
        # fill the users list
        for res in users:
            try:
                res_str = {
                    k: list(map(bytes.decode, v)) for (k, v) in res[1].items()
                }
            except TypeError:
                res_str = dict(res[1].items())
            if res_str:
                mail = res_str.get("mail", None)
                forward = res_str.get("mailForwardingAddress", None)
                user_id = res_str.get("uid")[0]
                # user info needs elements user_id, first_name, last_name, email
                ldap_entry = ()
                if forward:
                    ldap_entry = (
                        user_id,
                        " ".join(res_str.get("sn", "")),
                        " ".join(res_str.get("givenName", "")),
                        forward[-1],
                        " ".join(res_str.get("homeDirectory", "")),
                    )
                elif mail:
                    ldap_entry = (
                        user_id,
                        " ".join(res_str.get("sn", "")),
                        " ".join(res_str.get("givenName", "")),
                        mail[-1],
                        " ".join(res_str.get("homeDirectory", "")),
                    )
                if ldap_entry:
                    user_info_dict[ldap_entry[0]] = ldap_entry
                    all_users.add(ldap_entry)
        groups = self.connection.search_s(
            settings.LDAP_GROUP_BASE,
            ldap.SCOPE_SUBTREE,
            attrlist=["member"],
            filterstr=settings.LDAP_GROUP_FILTER,
        )
        # fill the users list
        user_info = []
        for user in self.merge_member(groups, "member"):
            # look up the user entries in the LDAP System
            # print to see the structure of the user

            uid = user.partition(",")[0].strip("uid=")
            if uid in user_info_dict:
                user_info.append(user_info_dict[uid])
        self.user_info = sorted(user_info, key=lambda tup: tup[1])
        return self.user_info


class UCARUserInformation(LdapUserInformation):
    def load_from_ldap(self):
        info = grp.getgrnam("freva")
        users = info.gr_mem
        user_info = []
        for user in users:
            tmp = pwd.getpwnam(user)
            name = tmp.pw_gecos.split(" ")
            user_info.append((user, name[1], name[0], "%s@ucar.edu" % user))
        self.user_info = sorted(user_info, key=lambda tup: tup[1])
        return self.user_info


def get_ldap_object():
    """
    Returns an instance of the ldap class specified in django settings
    """
    try:
        parts = settings.LDAP_MODEL.split(".")
        model_name = parts[-1]
        module = ".".join(parts[:-1])
    except (ValueError, AttributeError):
        raise ImproperlyConfigured(
            "LDAP_MODEL must be of the form "
            '"module.model_name" (i.e. django_evaluation.ldaptools.MiklipUserInformation'
        )
    m = importlib.import_module(module)
    return getattr(m, model_name)()


# This is for backward compatibility
miklip_user_information = get_ldap_object
