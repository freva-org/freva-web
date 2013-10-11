import evaluation_system.api.plugin_manager as pm
from django.http import Http404

import paramiko

def get_plugin_or_404(plugin_name):
    
    try:
        return pm.getPluginInstance(plugin_name)
    except:
        raise Http404
    
    
def ssh_call(username, password, command, hostname='127.0.0.1'):
    """
    executes a command under the given user on a remote machine.
    :param username: login name
    :param password: password
    :param command: the command to be executed
    :param hostname: The hostname default: localhost
    :return: triple of FileChannels (stdin, stdout, stderr) to read
            the stdout stdout.getlines()
    """
    
    # create the ssh client
    ssh = paramiko.SSHClient()

    # except remote key anyways
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=hostname, username=username, password=password)

    (stdin, stdout, stderr) = ssh.exec_command(command=command)
    
    # close the connection
    ssh.close()
    
    return (stdin, stdout, stderr)
