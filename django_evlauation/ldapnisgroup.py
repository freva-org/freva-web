import ldap

from django_auth_ldap.config import LDAPGroupType

class LDAPNisGroupType(LDAPGroupType):
    """
    This class provides group verification via LDAP at
    the DKRZ architecture based on NIS
    """
    def user_groups(self, ldap_user, group_search):
        """
        Overrides LDAPGroupType.user_groups
        ldap_user represents the user and has the following three
        properties:

        dn: the distinguished name
        attrs: a dictionary of LDAP attributes (with lists of values)
        connection: an LDAPObject that has been bound with credentials

        This is the primitive method in the API and must be implemented.
        """

        raise Exception('dn=' + ldap_user.dn)
    
        result = []

        SEARCH_BASE = 'ou=netgroup,o=ldap,o=root'
        ldap_filter='(nisNetgroupTriple=\(,%(user)s,\))'
        attrs = ['cn']

        print 'Searching...', SEARCH_BASE, filter
        s = ldap_user.connect.search_s( SEARCH_BASE, ldap.SCOPE_SUBTREE,
                                        ldap_filter,
                                        attrs)

        for entry in s:
            result.append(entry[1]['cn'][0])
            
        return result
    
    def is_member(self, ldap_user, group_dn):
        """
        This method is an optimization for determining group membership without
        loading all of the user's groups. Subclasses that are able to do this
        may return True or False. ldap_user is as above. group_dn is the
        distinguished name of the group in question.

        The base implementation returns None, which means we don't have enough
        information. The caller will have to call user_groups() instead and look
        for group_dn in the results.
        """
                
        SEARCH_BASE = 'ou=netgroup,o=ldap,o=root'
        ldap_filter='(nisNetgroupTriple=\(,%(user)s,\))'
        attrs = ['cn']

        print 'Searching...', SEARCH_BASE, filter
        s = ldap_user.connect.search_s( SEARCH_BASE, ldap.SCOPE_SUBTREE,
                                        ldap_filter,
                                        attrs)

        return len(s) > 0

