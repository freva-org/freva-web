import shlex
from subprocess import PIPE, run


def run_cmd(inp: str) -> int:
    """Run a python manage.py command."""
    cmd = f"python manage.py {inp}"
    res = run(
        shlex.split(cmd),
        check=False,
        stdout=PIPE,
        stderr=PIPE,
        encoding="utf-8",
    )
    if res.returncode != 0:
        print("================== STDOUT ============================")
        print(res.stdout)
        print("================== STDERR ============================")
        print(res.stderr)
    return res.returncode


def test_migrations():
    """Test migrations."""
    assert run_cmd("makemigrations base") == 0
    assert run_cmd("migrate --fake-initial --noinput") == 0
    assert run_cmd("migrate --fake contenttypes") == 0
    assert run_cmd("collectstatic --noinput") == 0


def test_chek():
    """Test the python manage.py check cmd"""
    assert run_cmd("check") == 0


def test_collectstatic():
    """Test the python manage.py collectstatic command."""
    assert run_cmd("collectstatic -n --noinput") == 0


def test_createsuperuser(random_admin):
    """The the python manage.py createsuperuser command."""
    assert (
        run_cmd(
            f"createsuperuser --username {random_admin} "
            "--email test@bla.com --noinput"
        )
        == 0
    )
