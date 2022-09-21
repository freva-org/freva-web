"""Deploy the evaluation_system / core."""
import argparse
import logging
from pathlib import Path
import shlex
from subprocess import CalledProcessError, PIPE, run
import urllib.request
from tempfile import TemporaryDirectory


MINICONDA_URL = "https://repo.anaconda.com/miniconda/Miniconda3-latest"

logging.basicConfig(format="%(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__file__)


def progress_bar(count: int, block_size: int, total_size: int) -> None:
    if count == 0:
        return
    frac = count * block_size / total_size
    percent = int(100 * frac)
    bar = "#" * int(frac * 40)
    msg = "Downloading: [{0:<{1}}] | {2}% Completed".format(bar, 40, round(percent, 2))
    print(msg, end="\r", flush=True)
    if frac >= 1:
        print()


def parse_args() -> argparse.Namespace:
    """Consturct command line argument parser."""

    ap = argparse.ArgumentParser(
        prog="install_conda",
        description="""This Programm installs the evaluation_system package.""",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    ap.add_argument(
        "install_prefix", type=Path, help="Install prefix for the environment."
    )
    ap.add_argument(
        "conda_env_file", type=Path, help="Path to the conda environment file."
    )
    ap.add_argument(
        "--arch",
        type=str,
        default="Linux-x86_64",
        choices=[
            "Linux-aarch64",
            "Linux-ppc64le",
            "Linux-s390x",
            "Linux-x86_64",
            "MacOSX-x86_64",
        ],
        help="Choose the architecture according to the system",
    )
    ap.add_argument(
        "--silent",
        "-s",
        action="store_true",
        default=False,
        help="Minimize writing to stdout",
    )
    args = ap.parse_args()
    return args


class CondaInstaller:
    def run_cmd(self, cmd: str, **kwargs) -> None:
        """Run a given command."""
        verbose = kwargs.pop("verbose", False)
        kwargs["check"] = False
        if self.silent and not verbose:
            kwargs["stdout"] = PIPE
            kwargs["stderr"] = PIPE
        res = run(shlex.split(cmd), **kwargs)
        if res.returncode != 0:
            try:
                print(res.stderr.decode())
            except AttributeError:
                # stderr wasn't piped
                pass
            raise CalledProcessError(res.returncode, cmd)

    def download_temp_conda(self, tempdir: str) -> Path:
        """Return to path an existing conda env, if there is none, cerate one."""

        tmp_env = Path(tempdir) / "env"
        conda_script = Path(tempdir) / "anaconda.sh"
        logger.info(f"Downloading {self.conda_url} script")
        reporthook = None
        if self.silent is False:
            reporthook = progress_bar
        urllib.request.urlretrieve(
            self.conda_url, reporthook=reporthook, filename=str(conda_script)
        )
        conda_script.touch(0o755)
        cmd = f"bash {conda_script} -p {tmp_env} -b -f"
        logger.info(f"Installing minconda:\n{cmd}")
        self.run_cmd(cmd)
        return tmp_env / "bin" / "conda"

    def create_conda(self, install_prefix: Path, conda_env_file: Path) -> None:
        """Create the conda environment."""
        with TemporaryDirectory(prefix="conda") as td:
            conda_exec_path = self.download_temp_conda(td)
            cmd = (
                f"{conda_exec_path} env create -q -p {install_prefix} "
                f"-f {conda_env_file.expanduser().absolute()} --force"
            )
            logger.info(f"Creating conda environment:\n{cmd}")
            self.run_cmd(cmd)

    def __init__(self, silent: bool = False, arch: str = "Linux-x86_64"):
        self.silent = silent
        if self.silent:
            logger.setLevel(logging.ERROR)
        self.conda_url = f"{MINICONDA_URL}-{arch}.sh"


if __name__ == "__main__":
    args = parse_args()
    Inst = CondaInstaller(arch=args.arch, silent=args.silent)
    Inst.create_conda(args.install_prefix, args.conda_env_file)
