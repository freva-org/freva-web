from django import template
from django.utils.safestring import mark_safe

import urllib.parse

register = template.Library()


@register.filter
def divide(value, arg):
    return int(value) / int(arg)


@register.filter
def lookup(d, key):
    return d[key]


@register.filter
def dict_to_url(d):
    if d is None:
        return ""
    return mark_safe(urllib.parse.urlencode(d, doseq=True))
