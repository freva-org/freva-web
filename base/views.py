""" Views for the base application """

from django.shortcuts import render

from datetime import datetime 

def home(request):
    """ Default view for the root """
    
    
    from history.models import History
    
    
    h = History.objects.create(tool='pca',
                               timestamp=datetime.now(),
                               status=History.processStatus.broken,
                               configuration= {},
                               uid = 'illing')
    
    h = History.objects.get(id=1)


    
    
    return render(request, 'base/home.html',{'h':h})
