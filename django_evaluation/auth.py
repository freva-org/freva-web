import logging
from mozilla_django_oidc.auth import OIDCAuthenticationBackend
import functools
import time
import requests
from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView
from django.urls import reverse


logger = logging.getLogger(__name__)

# The following decorator is the replacement for the login_required decorator
# from django.contrib.auth.decorators. We need this for OIDC token handling
def oidc_token_required(view_func):
    """
    Decorator to gurantee the user has a valid OIDC access token.
    If not, redirects to OIDC authentication flow to obtain one.
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            next_url = request.get_full_path()
            return HttpResponseRedirect(f"/?login_required=1&next={next_url}")
        
        access_token = request.session.get('oidc_access_token')
        if not access_token:
            request.session['oidc_login_next'] = request.get_full_path()
            request.session.save()
            return HttpResponseRedirect(reverse('oidc_authentication_init'))

        token_expiry = request.session.get('oidc_id_token_expiration', 0)
        current_time = int(time.time())
        if token_expiry and current_time > token_expiry - 30:  # 30 seconds buffer
            refresh_token = request.session.get('oidc_refresh_token')
            if refresh_token:
                try:
                    token_url = settings.OIDC_OP_TOKEN_ENDPOINT
                    data = {
                        'client_id': settings.OIDC_RP_CLIENT_ID,
                        'client_secret': settings.OIDC_RP_CLIENT_SECRET,
                        'grant_type': 'refresh_token',
                        'refresh_token': refresh_token
                    }
                    
                    response = requests.post(token_url, data=data)
                    if response.status_code == 200:
                        # Update tokens in session
                        token_info = response.json()
                        request.session['oidc_access_token'] = token_info['access_token']
                        request.session['oidc_id_token'] = token_info.get('id_token')
                        request.session['oidc_refresh_token'] = token_info.get('refresh_token')
                        if 'expires_in' in token_info:
                            request.session['oidc_token_expiry'] = current_time + token_info['expires_in']
                    else:
                        return redirect('oidc_authentication_init') 
                except Exception as e:
                    logger.error(f"Token refresh failed: {e}")
                    return redirect('oidc_authentication_init')
            else:
                return redirect('oidc_authentication_init')
        return view_func(request, *args, **kwargs)
    
    return wrapper

def get_auth_header(request):
    """
    Get the authorization header for API requests.
    """
    access_token = request.session.get('oidc_access_token')
    if access_token:
        return {'Authorization': f'Bearer {access_token}'}
    return {}



class CustomOIDCBackend(OIDCAuthenticationBackend):
    """
    A light wrapper around the OIDCAuthenticationBackend to add
    custom functionality for our application.

    1. Use preferred_username or fall back to sub
    2. Map OIDC claims into Django User fields
    3. Store refresh_token in session (mozilla_django_oidc does not do this)
    """
    def get_username(self, claims):
        return claims.get('preferred_username') or claims.get('sub')

    def create_user(self, claims):
        user = super().create_user(claims)
        user.first_name = claims.get('given_name', '')
        user.last_name  = claims.get('family_name', '')
        user.save()

        return user

    def update_user(self, user, claims):
        user.first_name = claims.get('given_name', '')
        user.last_name  = claims.get('family_name', '')
        user.save()
        return user
    def get_token(self, payload):
        """
        Exchange code<->tokens with the OP, then persist the refresh_token.
        """
        token_info = super().get_token(payload)
        refresh = token_info.get("refresh_token")
        if refresh:
            self.request.session["oidc_refresh_token"] = refresh
            self.request.session.save()
        else:
            logger.warning("No refresh_token returned; check your scopes/settings")
        return token_info






class CustomOIDCCallbackView(OIDCAuthenticationCallbackView):
    """Custom OIDC callback view to store tokens in session"""
    
    def get(self, request):
        """Override get to handle the state not found error gracefully"""
        if 'oidc_states' not in request.session:
            # Redirect to authentication init instead of raising an exception
            return HttpResponseRedirect(reverse('oidc_authentication_init'))
        
        return super().get(request)
    
    def get_token_info(self, code, state, redirect_uri):
        """Override to store token info for access in login_success"""
        token_info = super().get_token_info(code, state, redirect_uri)
        self.token_info = token_info
        return token_info
    
    def login_success(self):
        """Store tokens and expiry time in session after successful login"""
        if hasattr(self, 'token_info'):
            self.request.session['oidc_access_token'] = self.token_info.get('access_token', '')
            self.request.session['oidc_id_token'] = self.token_info.get('id_token', '')
            self.request.session['oidc_refresh_token'] = self.token_info.get('refresh_token', '')
            if 'expires_in' in self.token_info:
                expiry_time = int(time.time()) + self.token_info['expires_in']
                self.request.session['oidc_token_expiry'] = expiry_time
            self.request.session.save()
            logger.info(f"Stored OIDC tokens in session")
        next_url = self.request.session.get('oidc_login_next')
        if next_url:
            logger.info(f"Redirecting to: {next_url}")
            del self.request.session['oidc_login_next']
            self.request.session.save()
            return HttpResponseRedirect(next_url)
        
        return super().login_success()