""" Views for the base application """

from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.template import RequestContext, loader

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.user import User
from evaluation_system.model.solr import SolrFindFiles

from plugins.utils import get_plugin_or_404
from plugins.models import PluginForm, PluginWeb

import urllib, os
import json

def home(request):
    """ Default view for the root """
    
    tools = pm.getPlugins()    
    return render(request, 'plugins/home.html', {'tool_list': tools})


def detail(request, plugin_name):
    
    plugin = get_plugin_or_404(plugin_name)
    plugin_web = PluginWeb(plugin)
    
    return render(request, 'plugins/detail.html', {'plugin':plugin_web})
    
def setup(request, plugin_name):
    
    plugin = get_plugin_or_404(plugin_name)
    plugin_web = PluginWeb(plugin)
    
    if request.method == 'POST':
        form = PluginForm(request.POST, tool=plugin)
        if form.is_valid():
            #start plugin
            pass
    else:   
        config_dict = plugin.setupConfiguration(check_cfg=False, substitute=False)      
        form = PluginForm(initial=config_dict,tool=plugin)
    
    
    return render(request, 'plugins/setup.html', {'tool' : plugin_web, 'form': form})
  
  
def dirlist(request):
    r=['<ul class="jqueryFileTree" style="display: none;">']
    files = list()
    try:
        r=['<ul class="jqueryFileTree" style="display: none;">']
        d=urllib.unquote(request.POST.get('dir','/home/illing'))
        for f in sorted(os.listdir(d)):
            if f[0] != '.':
                ff=os.path.join(d,f)
                if os.path.isdir(ff):
                    r.append('<li class="directory collapsed"><a href="#" rel="%s/">%s</a></li>' % (ff,f))
                else:
                    e=os.path.splitext(f)[1][1:] # get .ext and remove dot
                    files.append('<li class="file ext_%s"><a href="#" rel="%s">%s</a></li>' % (e,ff,f))
        r = r+files
        r.append('</ul>')
    except Exception,e:
        r.append('Could not load directory: %s' % str(e))
        r.append('</ul>')
    return HttpResponse(''.join(r))  

def solr_search(request):
    #args = self.request.arguments.copy()
    latest = bool(request.GET.get('latest', [False]))
    facets = request.GET.get('facet', None)
    #if 'start' in args: args['start'] = int(request.GET.get('start')) 
    #if 'rows' in args: args['rows'] = int(request.GET.get('rows'))
    
    metadata = None
    if facets:
        if facets == ['*']:
            #means select all, 
            facets = None
        results = SolrFindFiles.facets(request.GET, facets=facets, )
    else:
        results = SolrFindFiles.search(request.GET, _retrieve_metadata = True, )
        metadata = results.next()
        results = list(results)
      
    return HttpResponse(json.dumps(dict(data=results, metadata=metadata)), content_type="application/json")



    
    
  
