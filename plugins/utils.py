import base64
import logging

import evaluation_system.api.plugin_manager as pm
import paramiko
from django.conf import settings
from django.http import Http404
from django.views.decorators.debug import sensitive_variables
from evaluation_system.misc import config


def get_scheduler_hosts(user):
    if user.groups.filter(
        name=config.get("external_group", "noexternalgroupset")
    ).exists():
        try:
            return settings.SCHEDULER_HOSTS_EXTERNAL
        except AttributeError:
            return settings.SCHEDULER_HOSTS
    # elif user.groups.filter(name='frevastud').exists():
    #    return ['poincare']
    else:
        return settings.SCHEDULER_HOSTS


def get_plugin_or_404(plugin_name, user=None):
    try:
        return pm.get_plugin_instance(plugin_name, user)
    except SyntaxError:
        raise
    except:
        raise Http404


@sensitive_variables("password")
def ssh_call(username, password, command, hostnames=["127.0.0.1"]):
    """
    executes a command under the given user on a remote machine.
    :param username: login name
    :param password: password
    :param command: the command to be executed
    :param hostnames: list of _hostnames default: ['127.0.0.1']
    :return: triple of FileChannels (stdin, stdout, stderr) to read
            the stdout stdout.getlines()
    """

    _hostnames = hostnames[:]
    hostname = _hostnames.pop()
    sentto = hostname
    env_dict = {"LC_TELEPHONE": base64.b64encode(password.encode()).decode()}
    while hostname:
        try:
            # create the ssh client
            ssh = paramiko.SSHClient()

            # except remote key anyways
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(
                hostname=hostname,
                username=username,
                password=password,
                look_for_keys=False,
            )

            # nullify the hostname to exit the loop
            hostname = None
        except paramiko.SSHException:
            # on exception try the next server
            logging.error("SSH connection to %s failed" % sentto)

            if _hostnames:
                hostname = _hostnames.pop()
                sentto = hostname
            else:
                raise

    (stdin, stdout, stderr) = ssh.exec_command(command=command, environment=env_dict)

    logging.debug("sent command '%s' to '%s'" % (command, sentto))

    # poll until executed command has finished
    stdout.channel.recv_exit_status()

    # close the connection
    ssh.close()

    return stdin, stdout, stderr


def is_path_relative_to(path, other):
    try:
        path.relative_to(other)
        return True
    except ValueError:
        return False


def plugin_metadata_as_dict(plugin_metadata):
    return {
        "name": plugin_metadata.name,
        "plugin_class": plugin_metadata.plugin_class,
        "plugin_module": plugin_metadata.plugin_module,
        "description": plugin_metadata.description,
        "user_exported": plugin_metadata.user_exported,
        "category": plugin_metadata.category,
        "tags": plugin_metadata.tags,
    }
