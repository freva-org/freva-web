from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required
from django.utils.safestring import mark_safe
from django.http import JsonResponse
from django.conf import settings
from paramiko import AuthenticationException

from plugins.utils import ssh_call, get_scheduler_hosts


@api_view(["POST"])
@login_required()
def ncdump(request):
    if request.user.isGuest():
        ncdump_out = "Guest users are not allowed to use this command.<br/>Normally you would see the output of <strong>ncdump</strong> here."
        return JsonResponse(
            {"ncdump": "", "error_msg": mark_safe(ncdump_out)}, status=403
        )

    fn = request.data.get("file")
    user_pw = request.data.get("pass")
    command = "%s %s" % (
        settings.NCDUMP_BINARY,
        fn,
    )

    try:
        result = ssh_call(
            request.user.username, user_pw, command, get_scheduler_hosts(request.user)
        )
        ncdump_out = mark_safe(result[1].read().decode("utf-8"))
        ncdump_err = mark_safe(result[2].read().decode("utf-8"))

        status = 500 if ncdump_err else 200
        return JsonResponse(
            {"ncdump": ncdump_out, "error_msg": ncdump_err}, status=status
        )
    except AuthenticationException:
        return JsonResponse(
            {"ncdump": "", "error_msg": "Authentication error"}, status=400
        )
    except Exception:
        # We can't list everything what can go wrong here but the user definitely needs
        # some error output. Therefore, we catch all exceptions
        return JsonResponse({"ncdump": "", "error_msg": "Unexpected error"}, status=500)
