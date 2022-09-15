import ldap

from django_evaluation import settings
from django.core.cache import cache, caches
from django.core.exceptions import ImproperlyConfigured
import importlib
from abc import ABCMeta, abstractmethod
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

    @staticmethod
    def _establish_ldap_connection():
        for SERVER in settings.AUTH_LDAP_SERVER_URI.split(","):
            if not settings.AUTH_LDAP_START_TLS:
                ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
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

    def _cache_ldap_users(self):
        if not self.user_info:
            caches["default"]
            self.user_info = cache.get("LDAP_user_info")
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
                self.user_info_dict = cache.get("LDAP_user_info_dict")
                if not self.user_info_dict:
                    self.user_info_dict = {}
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
        user_uids = res[0][1].get("memberUid", [])
        # fill the users list
        for user in user_uids:
            uid = user.decode()

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
                        user_info.append((uid, prename, lastname, email, home_dir))
                        break

        self.user_info = sorted(user_info, key=lambda tup: tup[1])
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
        con = self.connection
        res = con.search_s(
            settings.LDAP_GROUP_BASE,
            ldap.SCOPE_SUBTREE,
            attrlist=["member"],
            filterstr=settings.LDAP_GROUP_FILTER,
        )
        self.miklip_user = []
        user_info = []
        # test print of the first search
        user_list = res[0][1].get("member", [])

        # fill the users list
        for user in user_list:
            # look up the user entries in the LDAP System
            # print to see the structure of the user
            try:
                uid = user.decode().split(",")[0]
            except AttributeError:
                uid = user.split(",")[0]
            res = con.search_s(
                settings.LDAP_USER_BASE,
                ldap.SCOPE_SUBTREE,
                attrlist=self.ldap_keys,
                filterstr=f"{uid}",
            )
            if res:
                try:
                    res_str = {
                        k: list(map(bytes.decode, v)) for (k, v) in res[0][1].items()
                    }
                except TypeError:
                    res_str = {k: v for (k, v) in res[0][1].items()}
                mail = res_str.get("mail", None)
                forward = res_str.get("mailForwardingAddress", None)
                user_id = uid.split("=")[-1]
                # user info needs elements user_id, first_name, last_name, email
                if forward:
                    user_info.append(
                        (
                            user_id,
                            " ".join(res_str.get("sn", "")),
                            " ".join(res_str.get("givenName", "")),
                            forward[-1],
                            " ".join(res_str.get("homeDirectory", "")),
                        )
                    )
                elif mail:
                    user_info.append(
                        (
                            user_id,
                            " ".join(res_str.get("sn", "")),
                            " ".join(res_str.get("givenName", "")),
                            mail[-1],
                            " ".join(res_str.get("homeDirectory", "")),
                        )
                    )
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
