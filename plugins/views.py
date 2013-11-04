""" Views for the base application """

from django.shortcuts import render, redirect
from django.http import HttpResponse, Http404
from django.template import RequestContext, loader
from django.contrib.auth.decorators import login_required
from django.conf import settings

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.user import User
from evaluation_system.model.solr import SolrFindFiles
from evaluation_system.model.slurm import slurm_file
from evaluation_system.misc import config

from plugins.utils import get_plugin_or_404, ssh_call
from plugins.models import PluginForm, PluginWeb
from history.models import History
from django_evlauation import settings

import logging
import paramiko # this is the ssh client

import urllib, os
import json

import datetime

@login_required()
def home(request):
    """ Default view for the root """
    
    tools = pm.getPlugins()    
    return render(request, 'plugins/home.html', {'tool_list': tools})

@login_required()
def detail(request, plugin_name):
    
    plugin = get_plugin_or_404(plugin_name)
    plugin_web = PluginWeb(plugin)
    
    return render(request, 'plugins/detail.html', {'plugin':plugin_web})
  
@login_required()    
def setup(request, plugin_name, row_id = None):
    
    plugin = get_plugin_or_404(plugin_name)
    plugin_web = PluginWeb(plugin)
    user = User(request.user.username, request.user.email)
    home_dir = user.getUserHome()
        
    if request.method == 'POST':
        form = PluginForm(request.POST, tool=plugin, uid=user.getName())
        if form.is_valid():
            # read the configuration
            config_dict = dict(form.data)
            config_dict = dict([(str(k), "'%s'" % str(v[0])) for k, v in config_dict.items()])
            logging.debug(config_dict)
            del config_dict['password_hidden'], config_dict['csrfmiddlewaretoken']

            # start the scheduler vie sbatch
            username = request.user.username
            password = request.POST['password_hidden']
            hostname = settings.SCHEDULER_HOST

            # compose the plugin command
            dirtyhack = 'export PYTHONPATH=/home/zmaw/u290038/git/evaluation_system/src;/home/zmaw/u290038/git/evaluation_system/bin/'
            command = plugin.composeCommand(config_dict,
                                            batchmode='web',
                                            email=user.getEmail())

            logging.debug("Calling command:" + command)
            # create the directories when necessary
            stdout = ssh_call(username=username,
                              password=password,
                              command=dirtyhack + command,
                              hostname=hostname)
                        
            # get the text form stdout
            out=stdout[1].readlines()
            err=stdout[2].readlines()

            logging.debug("output of analyze:" + str(out))
            logging.debug("errors of analyze:" + str(err))
            
            # get the very first line only
            out_first_line = out[0]
            
            # read the id from stdout
            if out_first_line.split(' ')[0] == 'Scheduled':
                row_id = int(out_first_line.split(' ')[-1])
            else:
                row_id = 0
                raise Http404, "Unexpected output of analyze:\n[%s]\n[%s]" % (out, err)            
                
            return redirect('history:results', id=row_id) #should be changed to result page 
            
    else:
        config_dict = None
        
        # load data into form, when a row id is given.
        if row_id:
            h = History.objects.get(pk=row_id)
            config_dict = h.config_dict()
        else:
            config_dict = plugin.setupConfiguration(check_cfg=False, substitute=True)
                  
        form = PluginForm(initial=config_dict,tool=plugin, uid=user.getName())
    
    
    return render(request, 'plugins/setup.html', {'tool' : plugin_web, 'form': form,
                                                  'user_home': home_dir})
  
@login_required()  
def dirlist(request):
    r=['<ul class="jqueryFileTree" style="display: none;">']
    files = list()
    try:
        r=['<ul class="jqueryFileTree" style="display: none;">']
        d=urllib.unquote(request.POST.get('dir'))
        for f in sorted(os.listdir(d)):
            if f[0] != '.':
                ff=os.path.join(d,f)
                if os.path.isdir(ff):
                    r.append('<li class="directory collapsed"><a href="#" rel="%s/">%s</a></li>' % (ff,f))
                else:
                    e=os.path.splitext(f)[1][1:] # get .ext and remove dot
                    if e == 'nc':
                        files.append('<li class="file ext_%s"><a href="#" rel="%s">%s</a></li>' % (e,ff,f))
        r = r+files
        r.append('</ul>')
    except Exception,e:
        r.append('Could not load directory: %s' % str(e))
        r.append('</ul>')
    return HttpResponse(''.join(r))  

@login_required()
def solr_search(request):
    args = dict(request.GET)#self.request.arguments.copy()
    latest = True#bool(request.GET.get('latest', [False]))
    try:
        facets = request.GET['facet']
    except KeyError:
        facets = False
    if 'start' in args: args['start'] = int(request.GET['start']) 
    if 'rows' in args: args['rows'] = int(request.GET['rows'])
    
    metadata = None
    #return HttpResponse(json.dumps(dict(args)))
    if facets:
        args.pop('facet')
        if facets == '*':
            #means select all, 
            facets = None
        results = SolrFindFiles.facets(facets=facets, **args)
    else:
        #return HttpResponse(json.dumps(dict(hallo='was')))
        results = SolrFindFiles.search( _retrieve_metadata = True, **args)
        metadata = results.next()
        results = list(results)
      
    return HttpResponse(json.dumps(dict(data=results, metadata=metadata)), content_type="application/json")



    
    
  
