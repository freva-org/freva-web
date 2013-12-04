from django.shortcuts import render
from django.http import HttpResponse 
from django.contrib.auth.decorators import login_required

import json
import os

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.db import _result_preview
from evaluation_system.model.user import User
from evaluation_system.misc import utils

from models import History, Result
from django_evlauation import settings


import logging


@login_required()
def history(request):
    
    
    try: 
        request.GET['uid']
        user = request.GET['uid']
    except KeyError:
        user = request.user
        
    try:
        tool = request.GET['plugin']
        history = History.objects.filter(uid=user).filter(tool=tool).order_by('id')
    except KeyError:
        history = History.objects.order_by('id').filter(uid=user)

    return render(request, 'history/history.html', {'history': history})

@login_required()
def results(request, id):
    from history.utils import pygtailwrapper
    
    #get history object
    history_object = History.objects.get(id=id)
    
    if history_object.status in [History.processStatus.running, History.processStatus.scheduled, History.processStatus.broken]:
        history_object = History.objects.get(id=id)

        try:
            file_content = pygtailwrapper(id, restart=True)
        except IOError:
            file_content =  'WARNING:\n'
                            'This is not the content of the file \'' + history_object.slurm_output + '\'.\n' +
                            'Probably, your home directory denies read access to the file.\n' +
                            'In this case the results will be shown after the tool has finished.\n' +
                            'You can view the tool\'s progress in a terminal with the command\n' +
                            'tail - f ' + history_object.slurm_output
        
        return render(request, 'history/results.html', {'file_content':file_content, 'history_object': history_object, 'result_object' : -1})
    
    else:
        #result_object = Result.objects.order_by('id').filter(history_id = id).filter(file_type = _result_preview)
        result_object = history_object.result_set.filter(file_type = _result_preview)
        return render(request, 'history/results.html', {'history_object': history_object, 'result_object' : result_object, 'PREVIEW_URL' : settings.PREVIEW_URL })
        
        
@login_required()
def tailFile(request, id):
    from history.utils import pygtailwrapper

    history_object = History.objects.get(id=id)
    new_lines = list()
    
    try: 
        for lines in pygtailwrapper(id):
            line = lines.replace('\n', '<br/>');
            new_lines.append(line)
    except IOError:
        pass
        
    if history_object.status < 2:
        new_lines = False
    
    return HttpResponse(json.dumps(new_lines), content_type="application/json")
    
    
    
    
    
    
