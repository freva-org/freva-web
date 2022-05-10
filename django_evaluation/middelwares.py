from evaluation_system.api import plugin_manager as pm


class ReloadPluginsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        pm.reload_plugins(request.user.username)
        response = self.get_response(request)
        return response
