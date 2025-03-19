from django import template

register = template.Library()

@register.filter
def dict_keys(d):
    """Return list of keys from a dict."""
    return list(d.keys())
