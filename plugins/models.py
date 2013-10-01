""" Basic models, such as user profile """
from django import forms
from django.forms import ValidationError
from django.core import validators
from django.forms.widgets import Input
from django.shortcuts import render_to_response

from django.template import loader

import evaluation_system.api.plugin_manager as pm
import evaluation_system.api.parameters as parameters


class PluginNotFoundError(Exception):
    pass



class PluginWeb(object):
    
    def __init__(self,plugin): 
        self.name = plugin.__class__.__name__
        self.short_description = plugin.__class__.__short_description__
        
    

class PluginFileFieldWidget(Input):

    def __init__(self, attrs):
        super(PluginFileFieldWidget, self).__init__(attrs)
        
    def render(self, name, value, attrs=None):
        
        #return '<input type="text" class="form-control" value="%s" id="%s" placeholder="%s" name="%s">' %(value, attrs['id'], name, name)
        return loader.render_to_string('plugins/filefield.html', {'name': name, 'value': value, 'id':attrs['id']})
        
        
class PluginFileField(forms.Field):
    
    default_error_message = {'invalid': 'This is not a valid path.'}
    
    def to_python(self, value):
        
        if value in validators.EMPTY_VALUES:
            return None
        
        return value
        
    def validate(self, value):
        
        if value != 'A':
            raise ValidationError(self.error_messages['invalid'])

        
    

class PluginForm(forms.Form):

    def __init__(self, *args, **kwargs):
        tool = kwargs.pop('tool')
        
        super(PluginForm, self).__init__(*args, **kwargs)
        
        
        for key in tool.__parameters__:
            
            param = tool.__parameters__.get_parameter(key)
            param_subtype = param.base_type
            
            if param.mandatory:
                required=True
            else: 
                required=False
            
            help_str = param.help
            
            if isinstance(param, parameters.Bool):
                self.fields[key] = forms.BooleanField(required=required, help_text=help_str)
            elif param_subtype == int:
                self.fields[key] = forms.IntegerField(required=required, help_text=help_str)
            elif isinstance(param, parameters.File):
                self.fields[key] = forms.CharField(required=required, help_text=help_str, widget=PluginFileFieldWidget({}))
            else:
                self.fields[key] = forms.CharField(required=required, help_text=help_str)
            #s.write(self.displayInput(key, config_dict[key], tool.__parameters__.get_parameter(key)))
        

        
        
        



            
            
        
    