#!/usr/bin/env python3
import argparse
import configparser
import logging
import hashlib
import os
from os import path as osp
from pathlib import Path
import re
import shlex
import sys
from subprocess import CalledProcessError
import shutil
import urllib.request
from tempfile import NamedTemporaryFile, TemporaryDirectory


MINICONDA_URL = "https://repo.anaconda.com/miniconda/"
ANACONDA_URL = "https://repo.anaconda.com/archive/"
CONDA_PREFIX = os.environ.get("CONDA_PREFIX", "Anaconda3-2021.05")
CONDA_VERSION = "{conda_prefix}-{arch}.sh"


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
    ap.add_argument('--python', type=str, default='3.9',
            help='Python Version')
    ap.add_argument('--pip', type=str, nargs='*', default=Installer.pip_pkgs,
            help='Additional packages that should be installed using pip')
    ap.add_argument('--no-conda', action='store_true', default=False,
            help='Do not install conda environment')
    ap.add_argument('--install-prefix', '--prefix', '--install_prefix',
            type=Path, default=Path(__file__).absolute().parent / 'conda',
            help='Set the install prefix')
    ap.add_argument('--silent', '-s', action='store_true', default=False,
            help='Silence output')
    args = ap.parse_args()
    return args



class Installer:

    default_pkgs = sorted(['fabric', 'sphinx', 'nose', 'mock',
                           'django-nose', 'coverage', 'pep8',
                           'pylint','django', 'markdown',
                           'bleach', 'python-memcached',
                           'django-debug-toolbar', 'python-ldap', 'ldap3',
                           'paramiko', 'django-ipware', 'pypdf2', 'mod_wsgi',
                           'requests', 'pygtail', 'django-webpack-loader',
                           'djangorestframework', 'conda', 'pillow' ,'pip',
                           'numpy', 'scipy', 'ffmpeg', 'imagemagick',
                           'mysqlclient', 'pymysql', 'ipython', 'xarray',
                           'dask', 'toml', 'gitpython' ])
    pip_pkgs = sorted(['pytest-html', 'pytest-html', 'python-git',
                       'python-swiftclient', 'pytest', 'pyest-env', 'testpath',
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

        kwargs['check'] = False
        if self.silent:
            kwargs['stdout'] = PIPE
            kwargs['stderr'] = PIPE
        res = run(shlex.split(cmd), **kwargs)
        if res.returncode != 0:
            try:
                print(res.stderr.decode())
            except AttributeError:
                # stderr wasn't piped
                pass
            raise CalledProcessError(res.returncode, cmd)

    def create_conda(self):
        """Create the conda environment."""
        with TemporaryDirectory(prefix='conda') as td:
            conda_script = Path(td) / 'anaconda.sh'
            tmp_env = Path(td) / 'env'
            logger.info(f'Downloading {CONDA_PREFIX} script')
            kwargs = {'filename': str(conda_script)}
            if  self.silent is False:
                kwargs['reporthook'] = reporthook
            urllib.request.urlretrieve(
                    self.conda_url+CONDA_VERSION.format(arch=self.arch,
                                                        conda_prefix=CONDA_PREFIX),
                    **kwargs
            )
            self.check_hash(conda_script)
            conda_script.touch(0o755)
            cmd = f"{self.shell} {conda_script} -p {tmp_env} -b -f"
            logger.info(f"Installing {CONDA_PREFIX}:\n{cmd}")
            self.run_cmd(cmd)
            cmd = f"{tmp_env / 'bin' / 'conda'} create -c {self.channel} -q -p {self.install_prefix} python={self.python} {' '.join(self.packages)} -y"
            logger.info(f'Creating conda environment:\n{cmd}')
            self.run_cmd(cmd)

    def check_hash(self, filename):
        archive = urllib.request.urlopen(self.conda_url).read().decode()
        md5sum = ''
        for line in archive.split('</tr>'):
            if CONDA_VERSION.format(arch=self.arch,
                                    conda_prefix=CONDA_PREFIX) in line:
                md5sum = line.split('<td>')[-1].strip().strip('</td>')
        md5_hash = hashlib.md5()
        with filename.open('rb') as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                md5_hash.update(byte_block)
        if md5_hash.hexdigest() != md5sum:
            raise ValueError('Download failed, md5sum mismatch: {md5sum} ')

    def pip_install(self):
        """Install additional packages using pip."""

        cmd = f"{self.python_prefix} -m pip install -I {' '.join(self.pip)}"
        logger.info(f'Installing additional packages\n\t {cmd}')
        self.run_cmd(cmd)
        cmd = f"{self.python_prefix} -m pip install -I {self.backend_url}"
        logger.info('Installing evaluation_system packages')
        self.run_cmd(cmd)

    @property
    def conda(self):
        return self.no_conda is False

    def __init__(self, args):
    
        for arg in vars(args):
            setattr(self, arg, getattr(args,arg))
        self.backend_url = 'git+'+EVAL_URL
        #self.install_prefix.mkdir(exist_ok=True, parents=True)

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
    Inst.pip_install()
