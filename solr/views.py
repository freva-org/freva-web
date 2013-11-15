"""
Created on 14.11.2013

@author: Sebastian Illing

views for the solr application
"""
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse

from evaluation_system.model.solr import SolrFindFiles

import json

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
