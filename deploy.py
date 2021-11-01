#!/usr/bin/env python3
import argparse
import configparser
import logging
import hashlib
from os import path as osp
from pathlib import Path
import re
import shlex
import sys
from subprocess import CalledProcessError
import shutil
import urllib.request
from tempfile import NamedTemporaryFile, TemporaryDirectory


SHASUM='1314b90489f154602fd794accfc90446111514a5a72fe1f71ab83e07de9504a7'
CONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-{arch}.sh"
EVAL_URL="https://gitlab.dkrz.de/freva/evaluation_system.git"


logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__file__)

def get_script_path():
    return osp.dirname(osp.realpath(sys.argv[0]))


def read(*parts):
    return open(osp.join(get_script_path(), *parts)).read()

def find_files(path, glob_pattern='*'):
    return [str(f) for f in Path(path).rglob(glob_pattern)]

def find_version(*parts):
    vers_file = read(*parts)
    match = re.search(r'^__version__ = "(\d+.\d+)"', vers_file, re.M)
    if match is not None:
        return match.group(1)
    raise RuntimeError("Unable to find version string.")

def reporthook(count, block_size, total_size):
    if count == 0:
        return
    progress_size = int(count * block_size)
    frac = count * block_size / total_size
    percent = int(100 * frac)
    bar = '#' * int(frac * 40)
    msg = "\rDownloading: [{0:<{1}}] | {2}% Completed".format(
           bar, 40, round(percent, 2))
    sys.stdout.write(msg)
    sys.stdout.flush()


def parse_args(argv=None):
    """Consturct command line argument parser."""

    ap = argparse.ArgumentParser(prog='deploy_freva_freva_web',
            description="""This Programm installs the evaluation_system package.""",
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    ap.add_argument('--packages', type=str, nargs='*',
            help='Pacakges that are installed', default=Installer.default_pkgs)
    ap.add_argument('--channel', type=str, default='conda-forge', help='Conda channel to be used')
    ap.add_argument('--shell', type=str, default='bash',
                    help='Shell type')
    ap.add_argument('--arch', type=str, default='Linux-x86_64',
                   help='The architecture for the current system')
    ap.add_argument('--python', type=str, default='3.9',
            help='Python Version')
    ap.add_argument('--pip', type=str, nargs='*', default=Installer.pip_pkgs,
            help='Additional packages that should be installed using pip')
    ap.add_argument('--no-conda', action='store_true', default=False,
            help='Do not install conda environment')
    ap.add_argument('--run_tests', action='store_true', default=False,
            help='Run unittests after installation')
    args = ap.parse_args()
    return args



class Installer:

    default_pkgs = sorted(['fabric', 'sphinx', 'nose', 'mock',
                           'django-nose', 'coverage', 'pep8',
                           'pylint','django', 'markdown',
                           'bleach', 'python-memcached',
                           'django-debug-toolbar', 'python-ldap',
                           'paramiko', 'django-ipware', 'pypdf2',
                           'requests', 'pygtail', 'django-webpack-loader',
                           'djangorestframework', 'conda', 'pip',
                           'numpy', 'scipy', 'ffmpeg', 'imagemagick',
                           'mysqlclient', 'pymysql', 'ipython', 'xarray',
                           'dask'])
    pip_pkgs = sorted(['pytest-html', 'python-git', 'python-swiftclient',
                       'django-auth-ldap', 'Django-datatable-view-compat',
                       'django-templated-email', 'django_compressor',
                       'django-bootstrap3', 'django-model-utils',
                       'django-discover-runner'])

    @property
    def conda_name(self):

        return self.install_prefix.name

    @staticmethod
    def run_cmd(cmd, **kwargs):
        """Run a given command."""

        res = os.system(cmd)
        if res != 0:
            raise CalledProcessError(res, cmd)

    def create_conda(self):
        """Create the conda environment."""

        with TemporaryDirectory(prefix='conda') as td:
            conda_script = Path(td) /'miniconda.sh'
            tmp_env = Path(td) / 'env'
            logger.info('Downloading miniconda script')
            urllib.request.urlretrieve(CONDA_URL.format(arch=self.arch),
                                      filename=str(conda_script),
                                      reporthook=reporthook)
            print()
            # self.check_hash(conda_script)
            conda_script.touch(0o755)
            cmd = f"{self.shell} {conda_script} -p {tmp_env} -b -f"
            logger.info(f'Installing miniconda:\n\t{cmd}')
            self.run_cmd(cmd)
            cmd = f"{tmp_env / 'bin' / 'conda'} create -c {self.channel} -q -p {self.install_prefix} python={self.python} {' '.join(self.packages)} -y"
            logger.info(f'Creating conda environment:\n\t {cmd}')
            self.run_cmd(cmd)

    @staticmethod
    def check_hash(filename):
        sha256_hash = hashlib.sha256()
        with filename.open('rb') as f:
            for byte_block in iter(lambda: f.read(4096),b""):
                sha256_hash.update(byte_block)
        if sha256_hash.hexdigest() != SHASUM:
            raise ValueError('Download failed, shasum mismatch')

    def pip_install(self):
        """Install additional packages using pip."""

        cmd = f"{self.python_prefix} -m pip install {' '.join(self.pip)}"
        logger.info(f'Installing additional packages\n\t {cmd}')
        self.run_cmd(cmd)
        cmd = f"{self.python_prefix} -m pip install {self.backend_url}"
        logger.info('Installing evaluation_system packages')
        self.run_cmd(cmd)

    @property
    def conda(self):
        return self.no_conda is False

    def __init__(self, args):
    
        self.this_dir = Path(__file__).absolute().parent
        for arg in vars(args):
            setattr(self, arg, getattr(args,arg))
        self.install_prefix = self.this_dir / 'conda'
        self.backend_url = 'git+'+EVAL_URL
        self.config_file = self.this_dir / 'evaluation_system.conf'
        if not self.config_file.is_file():
            raise ValueError('No config file. Copy the evaluation_system.conf'
                             ' file into this directory first')
        #self.install_prefix.mkdir(exist_ok=True, parents=True)

    def create_config(self):
        """Copy evaluation_system.conf to etc."""

        cfg = configparser.ConfigParser(\
                interpolation=configparser.ExtendedInterpolation())
        config = cfg.read(self.config_file)
        cfg['evaluation_system']['root_dir'] = str(self.install_prefix)
        with (self.install_prefix / 'etc' / self.config_file.name).open('w') as f:
            cfg.write(f)

    @property
    def python_prefix(self):
        """Get the path of the new conda evnironment."""
        return self.install_prefix / 'bin' / 'python3'
if __name__ == '__main__':
    import sys, os
    args = parse_args(sys.argv)
    Inst = Installer(args)
    if Inst.conda:
        Inst.create_conda()
    Inst.create_config()
    Inst.pip_install()
