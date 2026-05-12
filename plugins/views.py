""" Views for the plugins application """

import json
import logging
import os
import subprocess
import sys
import urllib
from pathlib import Path

import evaluation_system.api.plugin_manager as pm
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.debug import sensitive_post_parameters, sensitive_variables
from evaluation_system.misc import config
from evaluation_system.model.user import User

from base.exceptions import UserNotFoundError
from base.Users import OpenIdUser
from history.models import Configuration, History
from plugins.forms import PluginForm, PluginWeb
from plugins.utils import (
    SSHFailureKind,
    classify_ssh_exception,
    get_plugin_or_404,
    get_scheduler_hosts,
    is_path_relative_to,
    ssh_call,
)


@login_required()
def plugin_list(request):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": "Plugins"})


@login_required()
def detail(request, plugin_name):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": plugin_name})


@login_required()
def search_similar_results(request, plugin_name=None, history_id=None):
    pm.reload_plugins(request.user.username)

    def hist_to_dict(h_obj):
        hist_dict = dict()
        results = h_obj.result_set.filter(file_type=1)
        hist_dict["preview"] = ""
        if len(results) > 0:
            hist_dict["preview"] = results[0].preview_file
        hist_dict["pk"] = h_obj.pk
        hist_dict["tool"] = h_obj.tool
        hist_dict["uid"] = str(h_obj.uid)
        return hist_dict

    data = {}

    try:
        user = OpenIdUser(request.user.username)
    except UserNotFoundError:
        user = User()
    if history_id is not None:
        o = Configuration.objects.filter(history_id_id=history_id)
        hist_objects = History.find_similar_entries(o, max_entries=5)

    else:
        # create the tool
        tool = pm.get_plugin_instance(plugin_name, user=user)
        param_dict = tool.__parameters__
        param_dict.synchronize(plugin_name)
        plugin_fields = param_dict.keys()

        # don't search for empty form fields
        for key, val in request.GET.items():
            if val != "":
                if key in plugin_fields:
                    data[key] = val

        try:
            o = pm.dict2conf(plugin_name, data, user=user)
        except Exception:
            return HttpResponse("[]")
        hist_objects = History.find_similar_entries(
            o, uid=request.user.username, max_entries=5
        )

    res = list()
    for obj in hist_objects:
        res.append(hist_to_dict(obj))
    #    data = serializers.serialize('json',hist_objects,fields=('preview'))
    return HttpResponse(json.dumps(res))


@sensitive_post_parameters("password_hidden")
@sensitive_variables("password")
@login_required()
def setup(request, plugin_name, row_id=None):
    pm.reload_plugins(request.user.username)
    try:
        user = OpenIdUser(request.user.username)
    except UserNotFoundError:
        user = User()

    plugin = get_plugin_or_404(plugin_name, user=user)

    error_msg = pm.get_error_warning(plugin_name)[0]

    plugin_dict = pm.get_plugin_metadata(
        plugin_name, user_name=request.user.username
    )
    try:
        scratch_dir = user.getUserScratch()
    except Exception:
        scratch_dir = None
    plugin_web = PluginWeb(plugin)

    if request.method == "POST":
        is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"

        form = PluginForm(
            request.POST, tool=plugin, uid=request.user.username, request=request
        )
        if not form.is_valid():
            if is_ajax:
                # Collect field-level errors into a readable message so the
                # frontend can show them instead of the generic "network error".
                messages = []
                for field_name, errors in form.errors.items():
                    if field_name == "__all__":
                        messages.extend(str(e) for e in errors)
                    elif field_name == "password_hidden":
                        messages.append(f"Password: {', '.join(str(e) for e in errors)}")
                    else:
                        label = form.fields[field_name].label or field_name
                        messages.append(f"{label}: {', '.join(str(e) for e in errors)}")
                error_text = (
                    "Please fix the following before submitting:\n• "
                    + "\n• ".join(messages)
                    if messages
                    else "Please fill in all required fields."
                )
                invalid_fields = [f for f in form.errors if f not in ("__all__", "password_hidden")]
                return JsonResponse({"form_errors": True, "error": error_text, "fields": invalid_fields}, status=400)

        if form.is_valid():
            # read the configuration
            config_dict = dict(form.data)

            # read the caption
            caption = config_dict[form.caption_field_name][0].strip()

            if not caption:
                caption = None

            unique_output = config_dict["unique_output_id"][0]

            # empty values in the form will not be added to the dictionary.
            # as a consequence we can not submit intentionally blank fields.
            tmp_dict = dict()
            for k, v in config_dict.items():
                if v[0]:
                    tmp_dict[str(k)] = "'%s'" % str(v[0])

            config_dict = tmp_dict
            del (
                config_dict["password_hidden"],
                config_dict["csrfmiddlewaretoken"],
            )
            _ = config_dict.pop(form.caption_field_name, "")
            logging.debug(config_dict)

            # start the scheduler via sbatch
            username = request.user.username
            password = request.POST["password_hidden"]
            hostnames = list(get_scheduler_hosts(request.user))

            logging.info(hostnames)
            # compose the plugin command

            slurm_options = config.get_section("scheduler_options")

            # Get modules and files to source
            config.reloadConfiguration()
            eval_str = f"EVALUATION_SYSTEM_CONFIG_FILE={config.CONFIG_FILE}"
            exe_path = f"PATH={settings.FREVA_BIN}:$PATH"

            if "EVALUATION_SYSTEM_PLUGINS_%s" % request.user in os.environ:
                plugin_str = os.environ[
                    "EVALUATION_SYSTEM_PLUGINS_%s" % request.user
                ]
                export_user_plugin = "EVALUATION_SYSTEM_PLUGINS=%s" % plugin_str
            else:
                export_user_plugin = ""
            scheduler_options = ",".join(
                [
                    s
                    for s in config_dict.get("extra_scheduler_options", "").split(
                        ","
                    )
                    if s.strip()
                ]
            )
            sched_opts_str = f"extra_scheduler_options={scheduler_options}"
            cmd = plugin.compose_command(
                config_dict,
                batchmode="web" if slurm_options else False,
                caption=caption,
                unique_output=unique_output,
            )
            if scheduler_options:
                cmd.append(sched_opts_str)
            command = " ".join(cmd)
            ssh_cmd = f'bash -c "{eval_str} {exe_path} {export_user_plugin} freva-plugin {command}"'
            logging.info(ssh_cmd)

            # finally send the ssh call
            try:
                _, stdout, stderr = ssh_call(
                    username=username,
                    password=password,
                    # we use "bash -c because users with other login shells can't use "export"
                    # not clear why we removed this in the first place...
                    command=ssh_cmd,
                    hostnames=hostnames,
                )
            except Exception as exc:
                failure = classify_ssh_exception(exc)
                logging.log(
                    logging.WARNING if failure.kind == SSHFailureKind.AUTH_FAILED else logging.ERROR,
                    "SSH %s for user %s: %s", failure.kind, username, exc,
                )
                status = 400 if failure.kind == SSHFailureKind.AUTH_FAILED else 503
                if is_ajax:
                    return JsonResponse({"error": failure.message}, status=status)
                return render(
                    request,
                    "plugins/setup.html",
                    {
                        "tool": plugin_web,
                        "user_exported": plugin_dict.user_exported,
                        "form": form,
                        "user_scratch": scratch_dir,
                        "error_message": error_msg,
                        "show_pw_error": failure.kind == SSHFailureKind.AUTH_FAILED,
                        "PREVIEW_URL": settings.PREVIEW_URL,
                        "ssh_error": failure.message,
                    },
                )

            # get the text form stdout
            out = stdout.readlines()
            err = stderr.readlines()

            logging.debug("command:" + str(ssh_cmd))
            logging.debug("output of analyze:" + str(out))
            logging.debug("errors of analyze:" + str(err))
            try:
                row_id = (
                    History.objects.filter(
                        uid=request.user.username, tool=plugin_name
                    )
                    .latest("timestamp")
                    .id
                )
            except Exception as error:
                logging.exception(error)
                # We couldn't find out the row id due to issues with the log file.
                # Redirect to user's history
                if is_ajax:
                    return JsonResponse(
                        {"redirect": reverse("history:history")}, status=200
                    )
                return redirect("history:history")

            if is_ajax:
                return JsonResponse(
                    {"redirect": reverse("history:results", kwargs={"id": row_id})},
                    status=200,
                )
            return redirect("history:results", id=row_id)

    else:
        # load data into form, when a row id is given.
        if row_id:
            h = History.objects.get(pk=row_id)
            config_dict = h.config_dict()
            f = PluginForm(tool=plugin, uid=user.getName())
            config_dict[f.caption_field_name] = h.caption
        else:
            config_dict = plugin.setup_configuration(
                check_cfg=False, substitute=True
            )

        form = PluginForm(
            initial=config_dict, tool=plugin, uid=user.getName(), request=request
        )

    return render(
        request,
        "plugins/setup.html",
        {
            "tool": plugin_web,
            "user_exported": plugin_dict.user_exported,
            "form": form,
            "user_scratch": scratch_dir,
            "error_message": error_msg,
            "show_pw_error": "password_hidden" in form.errors.keys(),
            "PREVIEW_URL": settings.PREVIEW_URL,
        },
    )


@login_required()
def dirlist(request):
    try:
        user = OpenIdUser(request.user.username)
        scratch_dir = user.getUserScratch()
    except UserNotFoundError as e:
        logging.exception(e)
        # This user has no access to the underlying system and therefore
        # must not be able to get a file listing
        return HttpResponse(
            '<div class="alert alert-danger">You are not allowed to see the folder listing</div>'
        )

    base_directory = Path(urllib.parse.unquote(request.POST.get("dir"))).resolve()
    if not is_path_relative_to(base_directory, scratch_dir):
        # user is trying to get a listing of a folder he is not allowed to see
        return HttpResponse(
            '<div class="alert alert-danger">Invalid base folder requested</div>'
        )
    elif not base_directory.exists():
        return HttpResponse(
            f'<div class="alert alert-warning">The directory {base_directory} does not exists. Please create it on a HPC login-node first</div>'
        )

    # we can specify an ending in GET request
    files = list()
    file_type = request.GET.get("file_type", "nc")
    r = ['<ul class="jqueryFileTree" style="display: none;">']
    try:
        for f in sorted(os.listdir(base_directory)):
            if f[0] != ".":
                ff = os.path.join(base_directory, f)
                if os.path.isdir(ff):
                    r.append(
                        '<li class="directory collapsed"><a href="#" rel="%s/">%s</a></li>'
                        % (ff, f)
                    )
                else:
                    e = os.path.splitext(f)[1][1:]  # get .ext and remove dot
                    if e == file_type:
                        files.append(
                            '<li class="file ext_%s"><a href="#" rel="%s">%s</a></li>'
                            % (e, ff, f)
                        )
    except Exception as e:
        r.append("Could not load directory: %s" % str(e))
    r = r + files
    r.append("</ul>")
    return HttpResponse("".join(r))


@login_required()
def list_dir(request):
    try:
        user = OpenIdUser(request.user.username)
        scratch_dir = user.getUserScratch()
    except UserNotFoundError:
        # This user has no access to the underlying system and therefore
        # must not be able to get a file listing
        return JsonResponse(
            {
                "status": "You are not allowed to see the folder listing",
                "folders": [],
            }
        )

    # we can specify an ending in GET request
    base_directory = Path(urllib.parse.unquote(request.GET.get("dir")))
    resolved_dir = base_directory.resolve()
    if (
        not is_path_relative_to(base_directory, scratch_dir)
    ) or not resolved_dir.exists():
        # user is trying to get a listing of a folder he is not allowed to see
        return JsonResponse(
            {"status": "Invalid base folder requested", "folders": []}
        )
    elif not base_directory.exists():
        return JsonResponse(
            {
                "status": f"The directory {base_directory} does not exists. Please create it on a HPC login-node first",
                "folders": [],
            }
        )

    files = []
    folders = []
    # we can specify an ending in GET request
    file_type = request.GET.get("file_type", "pdf")
    try:
        for f in sorted(os.listdir(base_directory)):
            if f[0] != ".":
                ff = os.path.join(base_directory, f)
                if os.path.isdir(ff):
                    folders.append(dict(type="folder", path=ff, name=f))
                else:
                    e = os.path.splitext(f)[1][1:]  # get .ext and remove dot
                    if e == file_type:
                        files.append(dict(type="file", ext=e, path=ff, name=f))
        folders = folders + files
    except Exception as e:
        return JsonResponse(
            {
                "status": "Could not load directory: %s" % str(e),
                "folders": [],
            }
        )
    return JsonResponse({"status": "success", "folders": folders})


def list_docu(request):
    return render(request, "plugins/list-docu.html")
