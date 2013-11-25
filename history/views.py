from django.shortcuts import render
from django.http import HttpResponse 
from django.contrib.auth.decorators import login_required

import json
import os

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.user import User
from evaluation_system.misc import utils

from models import History, Result
from django_evlauation import settings

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
    
    #get history object
    history_object = History.objects.get(id=id)
    
    if history_object.status == History.processStatus.running:
        history_object = History.objects.get(id=id)
        file_name = history_object.slurm_output
        with open(file_name) as f:
            file_content = f.readlines()
        
        return render(request, 'history/results.html', {'file_content':file_content, 'history_object': history_object})
    
    else:
        result_object = Result.objects.order_by('id').filter(history_id = id)
        return render(request, 'history/results.html', {'history_object': history_object, 'result_object' : result_object })
        
        
@login_required()
def tailFile(request, id):
    
    from pygtail import Pygtail

    history_object = History.objects.get(id=id)
    full_file_name = history_object.slurm_output
    
    new_lines = list()
    
    # path for the offset file
    utils.supermakedirs(settings.TAIL_TMP_DIR, 0777)
    
    file_name = os.path.basename(full_file_name)
    
    # offset file
    offset_file_name = os.path.join(settings.TAIL_TMP_DIR, file_name)
    offset_file_name = offset_file_name + '.offset'
    
    
    
    
    for lines in Pygtail(full_file_name, offset_file=offset_file_name):
        line = lines.replace('\n', '<br/>');
        new_lines.append(line)
        
    if history_object.status < 2:
        new_lines = False
    
    return HttpResponse(json.dumps(new_lines), content_type="application/json")
    
    
    
    
    
    