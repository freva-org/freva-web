import evaluation_system.api.plugin_manager as pm
from django.http import Http404

def get_plugin_or_404(plugin_name):
    
    try:
        return pm.getPluginInstance(plugin_name)
    except:
        raise Http404