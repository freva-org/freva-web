from django.shortcuts import render
from django.http import HttpResponse 
from django.contrib.auth.decorators import login_required

import json

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.user import User

from models import History

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
        return render(request, 'history/results.html', {'history_object': history_object})
        
        
@login_required()
def tailFile(request, id):
    
    from pygtail import Pygtail

    history_object = History.objects.get(id=id)
    file_name = history_object.slurm_output
    
    new_lines = list()
    for lines in Pygtail(file_name):
        line = lines.replace('\n', '<br/>');
        new_lines.append(line)
    
    return HttpResponse(json.dumps(new_lines), content_type="application/json")
    
    
    
    
    
    