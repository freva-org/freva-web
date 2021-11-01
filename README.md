# Python environment setup

Most of the required python packages are beeging installed via conda.
To install python bindings simply execute the `deployment.py` script.


```bash
$: python ./deploy.py --help
usage: deploy_freva_freva_web [-h] [--packages [PACKAGES [PACKAGES ...]]] [--channel CHANNEL] [--shell SHELL] [--arch ARCH] [--python PYTHON] [--pip [PIP [PIP ...]]]
                              [--no-conda] [--run_tests]

This Programm installs the evaluation_system package.

optional arguments:
  -h, --help            show this help message and exit
  --packages [PACKAGES [PACKAGES ...]]
                        Pacakges that are installed (default: ['bleach', 'conda', 'coverage', 'dask', 'django', 'django-debug-toolbar', 'django-ipware', 'django-nose',
                        'django-webpack-loader', 'djangorestframework', 'fabric', 'ffmpeg', 'imagemagick', 'ipython', 'markdown', 'mock', 'mysqlclient', 'nose', 'numpy',
                        'paramiko', 'pep8', 'pip', 'pygtail', 'pylint', 'pymysql', 'pypdf2', 'python-ldap', 'python-memcached', 'requests', 'scipy', 'sphinx', 'xarray'])
  --channel CHANNEL     Conda channel to be used (default: conda-forge)
  --shell SHELL         Shell type (default: bash)
  --arch ARCH           The architecture for the current system (default: Linux-x86_64)
  --python PYTHON       Python Version (default: 3.9)
  --pip [PIP [PIP ...]]
                        Additional packages that should be installed using pip (default: ['pytest-html', 'python-git', 'python-swiftclient'])
  --no-conda            Do not install conda environment (default: False)
  --run_tests           Run unittests after installation (default: False)
```

After successful installation you can activate the `freva_web` environment:

```bash
$: conda activate ./conda
```
or

```bash
$: source ./conda/bin/activate
```
# Django deployment

you can check if django is working and corretly configured by:

```bash
$:  python manage.py check
```

If checks are passing issue the following command

```bash
$: python manage.py migrate
```


# React / Webpack usage:

Install dependencies:

```bash

$: npm install

```
Build project:


```bash
$: npm run build
$: npm run build-production   # optimized production build

```
Development:

```bash
$: npm run dev   # starts webpack-dev-server including hot-reloading
```
# Deploy a new version:

```bash
$: git pull
$: python manage.py collectstatic  # get new js files
```
