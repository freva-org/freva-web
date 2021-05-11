#!/bin/bash

PYTHONVERSION="3.9"
ADMINS=b380001


THIS_DIR=$(dirname $(readlink -f $0))
YOURPYTHON="${THIS_DIR}/venv"
mkdir -p $YOURPYTHON
shasum=1314b90489f154602fd794accfc90446111514a5a72fe1f71ab83e07de9504a7
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/anaconda.sh
if [ $(sha256sum /tmp/anaconda.sh| awk '{print $1}') != $shasum ];then
    >&2 echo 'Checksums do not match'
    exit 1
fi
chmod +x /tmp/anaconda.sh
/tmp/anaconda.sh -p /tmp/anaconda -b -f -u
/tmp/anaconda/bin/conda create -c conda-forge -q -p $YOURPYTHON python=$PYTHONVERSION conda pip numpy scipy imagemagick ffmpeg bcrypt mysqlclient pymysql ipyton -y
let success=$?
rm -r /tmp/anaconda /tmp/anaconda.sh
[[ $success -ne 0 ]] && echo "conda create -c conda-forge -q -p $YOURPYTHON python=$PYTHONVERSION -y failed! EXIT" && exit 1


