""" Views for the base application """

from django.shortcuts import render
import django.contrib.auth as auth

from datetime import datetime 

def home(request):
    """ Default view for the root """
    
    
    from history.models import History
    
    try:
        user = request.POST["user"]
        passwd = request.POST["password"]
        keys = [user, auth.authenticate(username=user, password=passwd)]

    except(Exception), e:
        keys = 'Exception: ' + str(e)
        
    h = History.objects.create(tool='pca',
                               timestamp=datetime.now(),
                               status=History.processStatus.broken,
                               configuration= {},
                               uid = 'illing')
    
    h = History.objects.get(id=1)


    
    
    return render(request, 'base/home.html',{'h':h, 'k':keys})
