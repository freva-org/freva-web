from django.shortcuts import render
from django.http import HttpResponse 

import json

import evaluation_system.api.plugin_manager as pm
from evaluation_system.model.user import User

from models import History

def history(request):
    
    
    try: 
        request.GET['uid']
        user = request.GET['uid']
    except KeyError:
        user = 'illing'    
    
    #old database
    #history = pm.getHistory(user=user)
    
    history = History.objects.filter(uid=user)
    
    
    return render(request, 'history/history.html', {'history': history})


def results(request, id):
    
    #get history object
    history_object = {'user': 'illing', 'status': 'finished', 'name': 'Tool name'}
   
    history_object = History.objects.get(id=id)
    
    if history_object.status == History.processStatus.running:
        file_name = '/home/illing/kunze_groups.txt'
        with open(file_name) as f:
            file_content = f.readlines()
        
        return render(request, 'history/results.html', {'file_content':file_content, 'history_object': history_object})
    
    else:
        return render(request, 'history/results.html', {'history_object': history_object})
        
        

def tailFile(request, id):
    
    from pygtail import Pygtail
    file_name = '/home/illing/kunze_groups.txt'
    
    new_lines = list()
    for lines in Pygtail(file_name):
        line = lines.replace('\n', '<br/>');
        new_lines.append(line)
    
    return HttpResponse(json.dumps(new_lines), content_type="application/json")
    
    
    
    
    
    