from django import template

register = template.Library()

@register.inclusion_tag('history/templatetags/dialog.html')
def cancel_dialog():
    return {}