import json

from django import template
from django.contrib.auth import get_user_model
from django.utils.safestring import mark_safe

from django_evaluation import settings

register = template.Library()


@register.inclusion_tag("history/templatetags/dialog.html")
def cancel_dialog():
    return {}


@register.inclusion_tag("history/templatetags/sendmail_dialog.html")
def sendmail_dialog(url, is_guest):
    return {"url": url, "is_guest": is_guest}


@register.inclusion_tag("history/templatetags/caption_dialog.html")
def caption_dialog(current, default, history_object, user):
    return {
        "current_caption": current,
        "default_caption": default,
        "history_object": history_object,
        "user": user,
    }


@register.inclusion_tag("history/templatetags/mailfield.html")
def mailfield(is_guest):
    """Extract the email information from users that have been logged in."""
    data = []
    if not is_guest:
        data = [
            {
                "id": u.username,
                "text": f"{u.first_name}, {u.last_name} ({u.email})",
            }
            for u in get_user_model()
            .objects.exclude(email__exact="")
            .exclude(email__isnull=True)
        ]
    return {"user_data": mark_safe(json.dumps(data)), "is_guest": is_guest}
