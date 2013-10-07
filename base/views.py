""" Views for the base application """

from django.shortcuts import render
import django.contrib.auth as auth


def home(request):
    """ Default view for the root """    
        
    login_failed = False
    
    
    if not request.user.is_authenticated():
        try:
            user = request.POST["user"]
            passwd = request.POST["password"]
            u = auth.authenticate(username=user, password=passwd)
        
            if u:
                auth.login(request, u)
            else:
                login_failed = True

        except(Exception):
            pass
        
    return render(request, 'base/home.html',{'login_failed':login_failed})

def logout(request):
    """
    Logout view.
    """
    auth.logout(request)
    
    return render(request, 'base/home.html',{'k':'logged out'})