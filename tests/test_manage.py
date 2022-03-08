import shlex
from subprocess import run, PIPE


def test_chek(eval_config):
    """Test the python manage.py check cmd"""
    cmd = f"python manage.py check"
    res = run(shlex.split(cmd), check=False, stdout=PIPE, stderr=PIPE)
    assert res.returncode == 0


def test_collectstatic(eval_config):
    """Test the python manage.py collectstatic command."""
    cmd = f"python manage.py collectstatic -n --noinput"
    res = run(shlex.split(cmd), check=False, stdout=PIPE, stderr=PIPE)
    assert res.returncode == 0


def test_createsuperuser(eval_config, random_admin):
    """The the python manage.py createsuperuser command."""
    cmd = (
        f"python manage.py createsuperuser --username {random_admin} "
        "--email test@bla.com --noinput"
    )
    res = run(shlex.split(cmd), check=False, stdout=PIPE, stderr=PIPE)
    assert res.returncode == 0
