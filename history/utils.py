import os

from evaluation_system.misc import utils
from models import History
from django_evlauation import settings


def pygtailwrapper(id, restart = False):
    """
    This function return the pygtail result for the slurm file
    specified in the history
    """
    from pygtail import Pygtail

    history_object = History.objects.get(id=id)
    full_file_name = history_object.slurm_output
        
    # path for the offset file
    utils.supermakedirs(settings.TAIL_TMP_DIR, 0777)
    
    file_name = os.path.basename(full_file_name)
    
    # offset file
    offset_file_name = os.path.join(settings.TAIL_TMP_DIR, file_name)
    offset_file_name = offset_file_name + '.offset'
    
    if restart and os.path.isfile(offset_file_name):
        os.remove(offset_file_name)
    
    
    return Pygtail(full_file_name, offset_file=offset_file_name)    
