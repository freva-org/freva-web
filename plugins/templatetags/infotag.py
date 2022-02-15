from django import template
from evaluation_system.api.plugin_manager import get_error_warning

register = template.Library()


@register.inclusion_tag('plugins/templatetags/infodialog.html')
def infodialog(caption, text, show='show'):
    if show is True:
        show = 'show'
        
    elif show is False:
        show = 'hide'
    
    return {'caption': caption,
            'text': text,
            'show':  show}
    
    
@register.inclusion_tag('plugins/templatetags/infodialog.html')
def error_warning_dialog(tool_name):
    (error, warning) = get_error_warning(tool_name.lower())
    
    if error:
        return infodialog('Error', error, 'show')
    elif warning:
        return infodialog('Warning', warning, 'show')
    else:
        return infodialog('', '', 'hide')
    

@register.inclusion_tag('plugins/templatetags/plugin_your_plugin.html')
def export_plugin_dialog(user_home, user_scratch):
    return {'caption': 'Plug-in your own plugin',
            'user_home': user_home,
            'user_scratch': user_scratch}
