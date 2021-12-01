
from configparser import ConfigParser, ExtendedInterpolation
import os
from pathlib import Path
import pytest
import mock
import random
import string
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
    with NamedTemporaryFile(suffix='.conf') as tf:
        env = dict(
                EVALUATION_SYSTEM_CONFIG_FILE=tf.name,
                PUBKEY=eval_pubkey,
                DEV_MODE='1',
                PATH=os.environ['PATH']
        )
        with open(tf.name, 'w') as f:
            config.write(f)
        with mock.patch.dict(os.environ, env, clear=True):
            yield config
@pytest.fixture(scope='function')
def random_admin():
    yield ''.join(random.choice(string.ascii_lowercase) for i in range(10))
