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
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
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
    - Separate cookie for access token (JavaScript accessible).
    """
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
            'prompt': 'none'
        }

        proxy_path = f"/api/freva-nextgen/auth/v2/login?{urlencode(params)}"
        full_login_url = request.build_absolute_uri(proxy_path)
        return HttpResponseRedirect(full_login_url)


class OIDCCallbackView(View):
    """callback view handling the OAuth2 response from freva-rest"""
    def get(self, request):
        code = request.GET.get('code')

        is_offline_request = 'request_offline_token' in request.session

        if not code:
            logger.error("No authorization code received in callback")
            if is_offline_request:
                return HttpResponse('<script>window.close();</script>')
            else:
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

                # OFFLINE TOKEN FLOW - Return HTML with postMessage to parent window
                if is_offline_request:
                    # Clean up session
                    request.session.pop('request_offline_token', None)

                    formatted_token = {
                        "access_token": token_data.get('access_token'),
                        "refresh_token": token_data.get('refresh_token'),
                        "token_type": token_data.get('token_type', 'Bearer'),
                        "expires": token_data.get('expires'),
                        "refresh_expires": token_data.get('refresh_expires'),
                        "scope": token_data.get('scope', 'openid profile offline_access')
                    }

                    return HttpResponse(f'''
                    <!DOCTYPE html>
                    <html>
                    <head><title>Token Retrieved</title></head>
                    <body>
                        <script>
                            const tokenData = {json.dumps(formatted_token)};
                            if (window.opener) {{
                                window.opener.postMessage({{
                                    type: 'OFFLINE_TOKEN_SUCCESS',
                                    tokenData: tokenData
                                }}, '*');
                            }}
                            window.close();
                        </script>
                    </body>
                    </html>
                    ''')

                # REGULAR LOGIN FLOW
                else:
                    request.session['access_token'] = token_data['access_token']
                    request.session['refresh_token'] = token_data['refresh_token']
                    request.session['token_expires'] = token_data['expires']
                    request.session['refresh_expires'] = token_data['refresh_expires']

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
                if is_offline_request:
                    return JsonResponse({'success': False, 'error': 'Token exchange failed'})
                else:
                    return render(request, 'base/home.html', {
                        'login_failed': True,
                        'error_message': 'Authentication failed - token exchange failed.'
                    })

        except Exception as e:
            logger.exception(f"Callback processing failed: {e}")
            if is_offline_request:
                return JsonResponse({'success': False, 'error': 'Authentication failed'})
            else:
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
def request_offline_token(request):
    """
    API endpoint to initiate offline token request.
    Since offline token is accessible only via login
    OIDC flow, we redirect to the login endpoint
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    try:
        # Set session flag for offline token request
        request.session['request_offline_token'] = True
        request.session.modified = True
        callback_url = request.build_absolute_uri('/callback')
        params = {
            'redirect_uri': callback_url,
            'offline_access': 'true',
            'prompt': 'none'
        }

        proxy_path = f"/api/freva-nextgen/auth/v2/login?{urlencode(params)}"
        auth_url = request.build_absolute_uri(proxy_path)

        return JsonResponse({
            'success': True,
            'auth_url': auth_url
        })

    except Exception as e:
        logger.exception(f"Offline token request failed: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


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
