""" Views for the base application """

from django.shortcuts import render
import django.contrib.auth as auth


def home(request):
    """ Default view for the root """    
        
    keys = ""
    
    if not request.user.is_authenticated():
        try:
            user = request.POST["user"]
            passwd = request.POST["password"]
            u = auth.authenticate(username=user, password=passwd)
            keys = [user, u, u.email]
        
            if u:
                auth.login(request, u)

        except(Exception), e:
            keys = 'Exception: ' + str(e)
            
        
    return render(request, 'base/home.html',{'k':keys})

def logout(request):
    auth.logout(request)
    
    return render(request, 'base/home.html',{'k':'logged out'})