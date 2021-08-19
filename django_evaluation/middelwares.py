from evaluation_system.api import plugin_manager as pm
#from django.utils.depreciation import MiddlewareMixin
from threading import current_thread

try:
    from threading import local
except ImportError:
    from django.utils._threading_local import local
try:
    from django.utils.deprecation import MiddlewareMixin
except ImportError:
    MiddlewareMixin = object

_thread_locals = local()
class MiddlewareMixin:
    def __init__(self, get_response=None):
        self.get_response = get_response
        super(MiddlewareMixin, self).__init__()

    def __call__(self, request):
        response = None
        if hasattr(self, 'process_request'):
            response = self.process_request(request)
        if not response:
            response = self.get_response(request)
        if hasattr(self, 'process_response'):
            response = self.process_response(request, response)
        return response

class ReloadPluginsMiddleware(MiddlewareMixin):

    def process_request(self, request):
        pm.reloadPlugins(request.user.username)


class GlobalUserMiddleware(MiddlewareMixin):
    """
    Sets the current authenticated user in threading locals

    Usage example:
        from app_name.middleware import get_current_user
        user = get_current_user()
    """
    def process_request(self, request):
        setattr(
            _thread_locals,
            'user_{0}'.format(current_thread().name),
            request.user)

    def process_response(self, request, response):

        key = 'user_{0}'.format(current_thread().name)

        if not hasattr(_thread_locals, key):
            return response

        delattr(_thread_locals, key)

        return response


def get_current_user():
    return getattr(
        _thread_locals,
        'user_{0}'.format(current_thread().name),
        None
    )
