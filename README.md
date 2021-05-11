# Pre-Requirements
You need the freva backend to be installed on the system. Please check the
install guide on the [evaluation_system repository](https://gitlab.dkrz.de/freva/evaluation_system).
The Path that contains the installation of the `evaluation_system` will be referred as `FREVA_PATH`

# Python environment setup

Most of the required python packages are beeging installed via conda.
To install python bindings simply execute the `setup.sh` script.

```bash
$: ./setup.sh FREVA_PATH
```

As mentioned above the `FREVA_PATH` is the path to an existing `evaluation_system`
backend installation. The script will create a new conda environment
in the `venv` folder. To activate this conda environment use the following command:

```bash
$: source activate
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
