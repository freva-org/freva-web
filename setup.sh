#!/bin/bash

PYTHONVERSION="3.9"
ADMINS=b380001


THIS_DIR=$(dirname $(readlink -f $0))
YOURPYTHON=$(readlink -f "${THIS_DIR}/venv")
mkdir -p $YOURPYTHON
CONDA_PKGS="fabric \
sphinx \
nose \
mock \
django-nose \
coverage \
pep8 \
pylint \
django \
markdown \
django_compressor \
bleach \
python-memcached \
django-debug-toolbar \
django-bootstrap3 \
python-ldap \
paramiko \
django-ipware \
django-model-utils \
pypdf2 \
requests \
pygtail \
django-webpack-loader \
djangorestframework \
conda \
pip \
numpy \
scipy \
ffmpeg \
imagemagick \
mysqlclient \
pymysql \
ipython"
#shasum=1314b90489f154602fd794accfc90446111514a5a72fe1f71ab83e07de9504a7
#wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/anaconda.sh
#if [ $(sha256sum /tmp/anaconda.sh| awk '{print $1}') != $shasum ];then
#    >&2 echo 'Checksums do not match'
#    exit 1
3fi
#chmod +x /tmp/anaconda.sh
#/tmp/anaconda.sh -p /tmp/anaconda -b -f -u
#/tmp/anaconda/bin/conda create -c conda-forge -q -p $YOURPYTHON python=$PYTHONVERSION $CONDA_PKGS -y
#let success=$?
#rm -fr /tmp/anaconda /tmp/anaconda.sh
#[[ $success -ne 0 ]] && echo "conda create -c conda-forge -q -p $YOURPYTHON python=$PYTHONVERSION $CONDA_PKGS -y failed! EXIT" && exit 1
${YOURPYTHON}/bin/conda activate $YOURPYTHON
${YOURPYTHON}/bin/pip install -r requirements.txt

