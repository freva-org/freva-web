from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def settings_val(value, default=""):
    """
    Returns a variable from the settings.
    Falls back to ``default`` if the setting is missing or evaluates to None.
    """
    result = getattr(settings, value, None)
    if result is None:
        return default
    return str(result)


@register.simple_tag
def setting_to_list(value):
    setting_value = getattr(settings, value)
    result = ""
    for val in setting_value:
        result += "<li>%s" % val
    return result


@register.simple_tag
def get_menu_entries(entry):
    return getattr(settings, entry, None)


@register.simple_tag
def external_group():
    return getattr(settings, "EXTERNAL_GROUP", None)
