"""Backend for the OIDC Server with Freva-rest OAuth2 Authorization Code Flow."""

import logging
from typing import Any, Optional

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from unidecode import unidecode

from base.views import ensure_url_scheme
from django_evaluation.utils import sync_mail_users

logger = logging.getLogger(__name__)


class OIDCAuthorizationCodeBackend(BaseBackend):
    """
    OIDC authorization backend using Authorization Code Flow.

    This backend authenticates users through the freva-rest OIDC endpoints
    and stores tokens in the session for subsequent API calls.
    """

    def __init__(self):
        self.userinfo_url = f"{ensure_url_scheme(settings.FREVA_REST_URL).rstrip('/')}/api/freva-nextgen/auth/v2/userinfo"
        self.systemuser_url = f"{ensure_url_scheme(settings.FREVA_REST_URL).rstrip('/')}/api/freva-nextgen/auth/v2/systemuser"
        self.token_url = f"{ensure_url_scheme(settings.FREVA_REST_URL).rstrip('/')}/api/freva-nextgen/auth/v2/token"

    def authenticate(self, request: Any, access_token: str = None, **kwargs):
        """
        Authenticate a user using an access token from OIDC flow.

        Parameters
        ----------
        request : HttpRequest
            The HTTP request object.
        access_token : str
            The access token obtained from the authorization code flow.

        Returns
        -------
        Optional[User]: The authenticated user instance if authentication is
                        successful, otherwise None.
        """
        if not access_token:
            return None

        try:
            # Get user info from freva-rest API
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(self.userinfo_url, headers=headers, timeout=5)
            if response.status_code == 200:
                user_info = response.json()
                user_model = get_user_model()
                username = user_info.get("username")
                if not username:
                    logger.warning("No username in user_info response")
                    return None
                user, created = user_model.objects.get_or_create(username=username)
                # Update user info without changing model structure
                # for satisfying the User model requirements (Freva-legacy)
                user.email = user_info.get("email", "")
                user.last_name = unidecode(user_info.get("last_name", ""))
                user.first_name = unidecode(user_info.get("first_name", ""))
                user.save()
                # Store user info in session for later use
                # authentication and authorization checks
                request.session['user_info'] = user_info

                # Fetch and cache system user info for validation
                # At the moment, we only validate the system user
                # via this and use the pw_dir for the home directory.
                system_user_info = self._get_system_user_info(access_token)
                if system_user_info:
                    request.session['system_user_info'] = system_user_info
                    request.session['system_user_valid'] = True
                    logger.info(f"System user validated for {username}")
                else:
                    request.session['system_user_valid'] = False
                    logger.warning(f"System user validation failed for {username}")

                sync_mail_users(oneshot=True)
                return user

        except Exception as e:
            logger.error(f"Authentication failed: {e}")

        return None

    def _get_system_user_info(self, access_token: str) -> Optional[dict]:
        """
        Validate the user against the systemuser endpoint.

        Exchanges the IDP access token for a freva-rest broker JWT first,
        then calls the systemuser endpoint with that broker JWT. This two-step
        process is required because the systemuser endpoint only accepts broker
        JWTs issued by freva-rest, not raw IDP tokens.

        Parameters
        ----------
        access_token : str
            The raw IDP access token from the authorization code flow.

        Returns
        -------
        Optional[dict]: System user info dict (username, email) if the user is
                        a full system user, otherwise None (guest).
        """
        broker_token = self._exchange_for_broker_token(access_token)
        if not broker_token:
            return None

        try:
            headers = {"Authorization": f"Bearer {broker_token}"}
            response = requests.get(self.systemuser_url, headers=headers, timeout=5)
            if response.status_code == 200:
                return response.json()
            logger.error(
                f"System user API error: {response.status_code} - {response.text}"
            )
            return None
        except Exception as e:
            logger.error(f"System user API error: {e}")
            return None

    def _exchange_for_broker_token(self, idp_token: str) -> Optional[str]:
        """
        Exchange an IDP access token for a freva-rest broker JWT.

        Uses RFC 8693 token exchange (grant type
        ``urn:ietf:params:oauth:grant-type:token-exchange``) to obtain a broker
        JWT from freva-rest. The broker JWT carries the user's roles as
        configured in freva-rest's ``token_claims`` and is signed by
        freva-rest's own key pair.

        Parameters
        ----------
        idp_token : str
            The raw IDP access token to exchange.

        Returns
        -------
        Optional[str]: The broker JWT access token if the exchange succeeded,
                       otherwise None.
        """
        try:
            resp = requests.post(
                self.token_url,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
                    "subject_token": idp_token,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10,
            )
            if resp.status_code == 200:
                return resp.json()["access_token"]
            logger.error(f"Broker exchange failed: {resp.status_code} - {resp.text}")
            return None
        except Exception as e:
            logger.error(f"Broker exchange error: {e}")
            return None

    def get_user(self, user_id: int) -> Optional[User]:
        """
        Retrieve a user instance by its ID.

        Parameters
        ----------
        user_id : int
            The ID of the user.

        Returns
        -------
        Optional[User]: The user instance if found, otherwise None.
        """
        user_model = get_user_model()
        try:
            return user_model.objects.get(pk=user_id)
        except user_model.DoesNotExist:
            return None
