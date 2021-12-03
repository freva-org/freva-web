
from configparser import ConfigParser, ExtendedInterpolation
import os
from pathlib import Path
import pytest
import mock
import random
import string
import sys
from tempfile import NamedTemporaryFile

def get_config():
    from evaluation_system.tests.mocks import TEST_EVAL
    test_cfg = ConfigParser(interpolation=ExtendedInterpolation())
    test_cfg.read_string(TEST_EVAL)
    cfg_p = ConfigParser(interpolation=ExtendedInterpolation())
    items_to_overwrite = [
            'db.host',
            'db.user',
            'db.passwd',
            'db.db',
            'db.port',
            'solr.host',
            'solr.port',
            'solr.core'
    ]
    try:
        cfg_p.read(os.environ['EVALUATION_SYSTEM_CONFIG_FILE'])
        cfg = dict(cfg_p['evaluation_system'].items())
    except (FileNotFoundError, KeyError):
        return test_cfg
    for key in items_to_overwrite:
        value = test_cfg['evaluation_system'].get(key)
        test_cfg.set('evaluation_system', key, cfg.get(key, value))
    return test_cfg


@pytest.fixture(scope='session')
def eval_pubkey():
    with NamedTemporaryFile(suffix='.crt') as tf:
        with Path(tf.name).open('w') as f:
            f.write('------ PUBLIC KEY ----\n12345\n---- END PUBLIC KEY ----')
        yield tf.name

@pytest.fixture(scope='session')
def eval_config(eval_pubkey):
    config = get_config()
    path_prefix = Path(sys.exec_prefix) / "bin"
    with NamedTemporaryFile(suffix='.conf') as tf:
        env = dict(
                EVALUATION_SYSTEM_CONFIG_FILE=tf.name,
                PUBKEY=eval_pubkey,
                DEV_MODE='1',
                DJANGO_SETTINGS_MODULE="django_evaluation.settings",
                PATH=str(path_prefix)+':'+os.environ['PATH'],
                PYTHONPATH=str(Path(__file__).parent.parent.absolute())
        )
        with open(tf.name, 'w') as f:
            config.write(f)
        with mock.patch.dict(os.environ, env, clear=True):
            yield config

@pytest.fixture(scope='function')
def random_admin(eval_config):
    user = ''.join(random.choice(string.ascii_lowercase) for i in range(10))
    yield user
    sys.path.insert(0, str(Path(__file__).parent.parent.absolute()))
    import django
    django.setup()
    from django.contrib.auth.models import User
    User.objects.get(username=user, is_superuser=True).delete()
