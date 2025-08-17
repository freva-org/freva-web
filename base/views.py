import base64
import glob
import json
import logging
import os
import time
from urllib.parse import urlencode, urlparse, urlunparse

import requests
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from evaluation_system.misc import config

from base.models import UIMessages
from django_evaluation.monitor import _restart

logger = logging.getLogger(__name__)

# Since the endpoints of auth are managing via Freva-rest API and always constant, we define the URLs here instead of settings.py
# shared variables for OIDC endpoints
def ensure_url_scheme(url, default_scheme='http'):
    parsed = urlparse(url)
    if not parsed.scheme:
        return f"{default_scheme}://{url}"
    return url

TOKEN_URL = ensure_url_scheme(settings.FREVA_REST_URL).rstrip('/') + '/api/freva-nextgen/auth/v2/token'
LOGIN_URL = '/api/freva-nextgen/auth/v2/login'

def set_token_cookie(response, token_data):
    """
    Set secure token cookies;
    - HttpOnly cookie for refresh token (server-side only)
    - Separate cookie for access token (JavaScript accessible).
    """
    refresh_cookie_data = {
        'refresh_token': token_data['refresh_token'],
        'refresh_expires': token_data['refresh_expires'],
    }

    json_string = json.dumps(refresh_cookie_data, separators=(',', ':'))
    encoded_refresh = base64.b64encode(json_string.encode('utf-8')).decode('ascii')

    response.set_cookie(
        'freva_refresh_token',
        encoded_refresh,
        max_age=token_data['refresh_expires'] - int(time.time()),
        httponly=True,
        secure=True,
        samesite='Strict'
    )

    access_cookie_data = {
        'access_token': token_data['access_token'],
        'token_type': 'Bearer',
        'expires': token_data['expires'],
        'scope': 'openid profile'
    }

    json_string = json.dumps(access_cookie_data, separators=(',', ':'))
    encoded_access = base64.b64encode(json_string.encode('utf-8')).decode('ascii')

    response.set_cookie(
        'freva_auth_token',
        encoded_access,
        max_age=token_data['expires'] - int(time.time()),
        httponly=False,
        secure=True,
        samesite='Strict'
    )

    return response

class OIDCLoginView(View):
    """
    View to initiate OIDC login flow by redirecting to freva-rest auth endpoints.
    """

    def get(self, request):
        """
        Redirect to freva-rest login endpoint to start OAuth2 flow.
        """
        next_url = request.GET.get('next', '/')
        # Store next URL in session for callback
        request.session['login_next'] = next_url

        # TODO: we might need to build the callback URL dynamically
        callback_url = request.build_absolute_uri('/callback')

        params = {
            'redirect_uri': callback_url,
            'prompt': 'login'
        }

        proxy_path = f"/api/freva-nextgen/auth/v2/login?{urlencode(params)}"
        full_login_url = request.build_absolute_uri(proxy_path)
        return HttpResponseRedirect(full_login_url)


class OIDCCallbackView(View):
    """
    Handle the callback from OIDC provider after user authentication.
    """

    def get(self, request):
        """
        Handle the authorization code callback and exchange for tokens.
        """
        code = request.GET.get('code')
        if not code:
            logger.error("No authorization code received in callback")
            return render(request, 'base/home.html', {
                'login_failed': True,
                'error_message': 'Authentication failed - no authorization code received.'
            })

        try:
            callback_url = request.build_absolute_uri('/callback')
            data = {
                'code': code,
                'redirect_uri': callback_url
            }
            headers = {"Content-Type": "application/x-www-form-urlencoded"}

            response = requests.post(TOKEN_URL, headers=headers, data=data, timeout=10)
            if response.status_code == 200:
                token_data = response.json()
                # Store tokens in session
                request.session['access_token'] = token_data['access_token']
                request.session['refresh_token'] = token_data['refresh_token']
                request.session['token_expires'] = token_data['expires']
                request.session['refresh_expires'] = token_data['refresh_expires']

                # Authenticate user
                user = authenticate(request=request, access_token=token_data['access_token'])
                if user:
                    login(request, user)
                    next_url = request.session.pop('login_next', '/')

                    if url_has_allowed_host_and_scheme(next_url, allowed_hosts=request.get_host()):
                        response = HttpResponseRedirect(next_url)
                    else:
                        response = HttpResponseRedirect('/')

                    response = set_token_cookie(response, token_data)
                    return response
                else:
                    logger.error("User authentication failed despite valid token")
                    return render(request, 'base/home.html', {
                        'login_failed': True,
                        'error_message': 'Authentication failed - could not authenticate user.'
                    })
            else:
                logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                return render(request, 'base/home.html', {
                    'login_failed': True,
                    'error_message': 'Authentication failed - token exchange failed.'
                })

        except Exception as e:
            logger.exception(f"Callback processing failed: {e}")
            return render(request, 'base/home.html', {
                'login_failed': True,
                'error_message': 'Authentication failed - please try again.'
            })


def home(request):
    """Default view for the root - authorization through session."""
    messages = UIMessages.objects.order_by("-id").filter(resolved=False)

    login_required_param = request.GET.get("login_required", False)
    is_guest_user = False
    if request.user.is_authenticated:
        is_guest_user = not request.session.get("system_user_valid", False)

    return render(
        request,
        "base/home.html",
        {
            "login_required": login_required_param,
            "messages": messages,
            "is_guest_user": is_guest_user,
        },
    )


def logout_view(request):
    """
    Logout view - clear session and Django auth.
    """
    # Clear all authentication-related session data (OIDC backend logout)
    auth_keys = ['access_token', 'refresh_token', 'token_expires', 
                'refresh_expires', 'user_info']
    for key in auth_keys:
        request.session.pop(key, None)

    # Django backend logout
    auth_logout(request)

    response = HttpResponseRedirect("/")
    # clear cookies set by Freva
    response.delete_cookie('freva_auth_token', path='/', samesite='Strict')
    response.delete_cookie('freva_refresh_token', path='/', samesite='Strict')
    return response


@csrf_exempt
def manual_refresh_token(request):
    """
    API endpoint for MANUAL token refresh (called by frontend).
    This is separate from automatic middleware refresh. (Re-New token button)
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    refresh_token = request.session.get('refresh_token')
    # the following condition is necessary to ensure that the refresh token is available
    # and not expired before proceeding with the refresh logic. Otherwise user cannot
    # manually refresh the token.
    if not refresh_token:
        return JsonResponse({'error': 'No refresh token available'}, status=400)
    
    refresh_expires = request.session.get('refresh_expires')
    if refresh_expires and int(time.time()) >= refresh_expires:
        return JsonResponse({'error': 'Refresh token expired'}, status=401)
    
    # cooldown logic same as middleware
    last_refresh_attempt = request.session.get('last_refresh_attempt', 0)
    current_time = int(time.time())
    if (current_time - last_refresh_attempt) < 30: #30s buffer
        return JsonResponse({'error': 'Please wait before refreshing again'}, status=429)
    
    # To prevent concurrent refresh attempts
    refresh_key = f"refreshing_token_{request.session.session_key}"
    if request.session.get(refresh_key):
        return JsonResponse({'error': 'Token refresh already in progress'}, status=429)
    
    try:
        # store refresh attempt time
        request.session['last_refresh_attempt'] = current_time
        request.session[refresh_key] = True
        request.session.modified = True
        
        data = {'refresh-token': refresh_token}
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        logger.info(f"Manual token refresh requested for user {request.user.username}")
        response = requests.post(TOKEN_URL, headers=headers, data=data, timeout=10)

        if response.status_code == 200:
            token_data = response.json()

            # Update session with new tokens
            request.session['access_token'] = token_data['access_token']
            request.session['refresh_token'] = token_data['refresh_token']
            request.session['token_expires'] = token_data['expires']
            request.session['refresh_expires'] = token_data['refresh_expires']
            # pop last_refresh_attempt to reset cooldown
            request.session.pop('last_refresh_attempt', None)
            request.session.modified = True

            logger.info(f"Manual token refresh successful for user {request.user.username}")
            # initi response to set cookie, then return JSON
            json_response = JsonResponse({
                'success': True,
                'access_token': token_data['access_token'],
                'expires': token_data['expires'],
                'expires_in': token_data['expires'] - int(time.time()),
                'message': 'Token refreshed successfully'
            })
            json_response = set_token_cookie(json_response, token_data)
            return json_response
        else:
            logger.error(f"Manual token refresh failed: {response.status_code} - {response.text}")
            return JsonResponse({
                'error': f'Token refresh failed: {response.status_code}',
                'details': response.text
            }, status=400)

    except Exception as e:
        logger.exception(f"Manual token refresh error for user {request.user.username}: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
    finally:
        # pop the refresh lock
        request.session.pop(refresh_key, None)
        request.session.modified = True


@csrf_exempt
def collect_current_token(request):
    """
    API endpoint to get current session token data.
    This ensures the frontend always shows the latest
    token from the session which might have been refreshed
    by the middleware or manually.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    # collect current session token data
    access_token = request.session.get('access_token')
    refresh_token = request.session.get('refresh_token')
    expires = request.session.get('token_expires')
    refresh_expires = request.session.get('refresh_expires')

    if access_token:
        token_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires': expires,
            'refresh_expires': refresh_expires,
            'token_type': "Bearer",
            'scope': "openid profile"
        }

        return JsonResponse({
            'success': True,
            'token_data': token_data
        })
    else:
        return JsonResponse({
            'success': False,
            'error': 'No token available in session. It seems you need to re-login'
        }, status=400)


def dynamic_css(request):
    main_color = settings.MAIN_COLOR
    hover_color = settings.HOVER_COLOR
    border_color = settings.BORDER_COLOR
    return render(
        request,
        "base/freva.css",
        {
            "main_color": main_color,
            "hover_color": hover_color,
            "border_color": border_color,
        },
        content_type="text/css",
    )


def wiki(request):
    """View rendering the iFrame for the wiki page."""
    return render(
        request,
        "base/wiki.html",
        {
            "page": "https://freva.gitlab-pages.dkrz.de/evaluation_system/sphinx_docs/index.html"
        },
    )


@login_required()
def shell_in_a_box(request):
    """View for the shell in a box iframe"""
    if request.user.groups.filter(
        name=config.get("external_group", "noexternalgroupset")
    ).exists():
        shell_url = "/shell2/"
    else:
        shell_url = "/shell/"

    return render(
        request, "base/shell-in-a-box.html", {"shell_url": shell_url}
    )


@login_required()
def contact(request):
    """View rendering the contact page."""
    if request.method == "POST":
        from templated_email import send_templated_mail

        myemail = settings.SERVER_EMAIL
        username = "freva-system"
        mail_text = request.POST.get("text")
        send_templated_mail(
            template_name="mail_to_admins",
            from_email=myemail,
            recipient_list=settings.CONTACTS,
            context={
                "username": username,
                "text": mail_text,
                "project": config.get("project_name"),
                "website": config.get("project_website"),
            },
            headers={"Reply-To": myemail},
        )
        return HttpResponseRedirect("%s?success=1" % reverse("base:contact"))
    success = True if request.GET.get("success", None) else False
    return render(request, "base/contact.html", {"success": success})


@login_required()
@user_passes_test(lambda u: u.is_superuser)
def restart(request):
    """Restart form for the webserver"""
    try:
        if request.POST["restart"] == "1":
            _restart(path=None)
    # TODO: Exception too broad!
    except:
        return render(request, "base/restart.html")

    return render(request, "base/home.html")


@login_required()
def stacbrowser(request):
    """STAC Browser view """
    stacapi_endpoint = f"/api/freva-nextgen/stacapi/"
    stacapi_url = request.build_absolute_uri(stacapi_endpoint)

    try:
        # based on one usecase, since there are two reverse
        # proxies in place. To ensure we have the correct URL,
        # we fetch the STAC API metadata and extract the self link.
        response = requests.get(stacapi_url, timeout=10)
        response.raise_for_status()
        stac_data = response.json()

        if 'links' in stac_data:
            for link in stac_data['links']:
                if link.get('rel') == 'self':
                    stacapi_url = link.get('href').rstrip('/') + '/'
                    break

    except Exception:
        pass  # Use fallback URL

    # Find the current asset files dynamically
    static_path = os.path.join(settings.PROJECT_ROOT, 'static_root', 'stac-browser')
    vendor_js = glob.glob(os.path.join(static_path, 'js', 'chunk-vendors.*.js'))
    app_js = glob.glob(os.path.join(static_path, 'js', 'app.*.js'))
    vendor_css = glob.glob(os.path.join(static_path, 'css', 'chunk-vendors.*.css'))
    app_css = glob.glob(os.path.join(static_path, 'css', 'app.*.css'))
    context = {
        'title': 'STAC Browser',
        'stac_api_url': stacapi_url,
        'stac_assets': {
            'vendor_js': os.path.basename(vendor_js[0]) if vendor_js else '',
            'app_js': os.path.basename(app_js[0]) if app_js else '',
            'vendor_css': os.path.basename(vendor_css[0]) if vendor_css else '',
            'app_css': os.path.basename(app_css[0]) if app_css else '',
        }
    }
    return render(request, 'stacbrowser.html', context)
