from pathlib import Path
import shlex
from subprocess import PIPE, run

CWD = Path(__file__).parent


def test_npm_install(eval_config):
    """Test the npm install procedure."""
    cmd = "npm install"
    res = run(shlex.split(cmd), cwd=CWD, stderr=PIPE, stdout=PIPE, check=False)
    print(res.stderr.decode())
    assert res.returncode == 0


def test_npm_build_prod(eval_config):
    """Test the npm build production."""
    cmd = "npm run build-production"
    res = run(shlex.split(cmd), cwd=CWD, stderr=PIPE, stdout=PIPE, check=False)
    print(res.stderr.decode())
    assert res.returncode == 0


def test_npm_build(eval_config):
    """Test the npm build."""
    cmd = "npm run build"
    res = run(shlex.split(cmd), cwd=CWD, stderr=PIPE, stdout=PIPE, check=False)
    print(res.stderr.decode())
    assert res.returncode == 0
