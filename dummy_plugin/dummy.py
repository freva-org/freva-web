import os
import shutil
import tempfile
import time
from pathlib import Path
from subprocess import PIPE, run

from evaluation_system.api.parameters import (
    Bool,
    Float,
    InputDirectory,
    Integer,
    ParameterDictionary,
    Range,
    SelectField,
    SolrField,
    String,
)
from evaluation_system.api.plugin import PluginAbstract
from evaluation_system.model.db import UserDB
from evaluation_system.model.user import User
from freva import logger


class DummyPlugin(PluginAbstract):
    """Stub class for implementing the abstract one"""

    __short_description__ = "A dummy plugin"
    __long_description__ = ""
    __version__ = (0, 0, 0)
    __tags__ = ["foo"]
    __category__ = "statistical"
    __name__ = "DummyPlugin"
    __parameters__ = ParameterDictionary(
        # Integer
        Integer(
            name="number",
            help="Optional integer — not mandatory",
        ),
        Integer(
            name="the_number",
            mandatory=True,
            help="This is *THE* number. Please provide it",
        ),
        # String
        String(
            name="something",
            default="test",
            mandatory=True,
            help="A mandatory string with a default",
        ),
        # Float
        Float(
            name="other",
            default=1.4,
            mandatory=True,
            help="A mandatory float with a default",
        ),
        # Bool(RadioSelect)
        Bool(
            name="debug_mode",
            default=False,
            mandatory=False,
            help="Enable debug mode (optional bool)",
        ),
        Bool(
            name="strict",
            default=True,
            mandatory=True,
            help="Mandatory bool — must be explicitly set",
        ),
        # Range (PluginRangeFieldWidget)
        Range(
            name="years",
            default="1990:2000",
            mandatory=False,
            help="Optional year range, e.g. 1990:5:2000",
        ),
        Range(
            name="levels",
            mandatory=True,
            help="Mandatory pressure levels range, e.g. 500,850",
        ),
        # File / InputDirectory (PluginFileFieldWidget)
        InputDirectory(
            name="input",
            mandatory=True,
            help="Mandatory input directory",
        ),
        InputDirectory(
            name="output_dir",
            mandatory=False,
            help="Optional output directory",
        ),
        # SelectField (PluginSelectFieldWidget)
        SelectField(
            name="variable",
            default="tas",
            multiple=True,
            allow_user_input=True,
            mandatory=True,
            options={"tas": "tas", "pr": "pr", "ua": "ua", "va": "va"},
            help="Mandatory multi-select variable",
        ),
        SelectField(
            name="frequency",
            multiple=False,
            allow_user_input=False,
            mandatory=False,
            options={"mon": "Monthly", "day": "Daily", "yr": "Yearly"},
            help="Optional single-select output frequency",
        ),
        # SolrField (SolrFieldWidget)
        SolrField(
            name="project",
            mandatory=True,
            facet="project",
            default="cmip6",
            max_items=1,
            help="Mandatory solr facet — select the project (e.g. cmip6, cordex)",
        ),
        SolrField(
            name="model",
            mandatory=False,
            facet="model",
            help="Optional solr facet — filter by model",
        ),
    )

    _runs: list = []
    _template = "${number} - $something - $other"
    tool_developer = {"name": "DummyUser", "email": "data@dkrz.de"}

    def run_tool(self, config_dict=None):
        DummyPlugin._runs.append(config_dict)
        num = config_dict.get("other", 1.4)
        print(f"Dummy tool was run with: {config_dict}")
        if num < 0:
            time.sleep(-num)
        tool_path = Path(__file__).parent / "plugin_env" / "bin" / "python"
        res = run(["which", "python"], stdout=PIPE, stderr=PIPE)
        assert "plugin_env" in os.environ["PATH"]
        return {
            "/tmp/dummyfile1": dict(type="plot"),
            "/tmp/dummyfile2": dict(type="data"),
        }


class DummyUser(User):
    """Create a dummy User object that allows testing"""

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        if self._random_home:
            self.cleanRandomHome()
        return True

    def __init__(self, random_home=False, uid=None, **override):
        self._random_home = None
        self.username = override.get("pw_name", None)
        if random_home:
            if "pw_dir" in override:
                raise Exception("Can't define random_home and provide a home directory")
            override["pw_dir"] = tempfile.mkdtemp("_dummyUser")
            self._random_home = override["pw_dir"]
        super().__init__(uid=uid)

        class DummyUserData(list):
            """Override a normal list and make it work like the pwd read-only struct"""

            _NAMES = "pw_name pw_passwd pw_uid pw_gid pw_gecos pw_dir pw_shell".split()

            def __init__(self, arr_list):
                list.__init__(self, arr_list)

            def __getattribute__(self, name):
                # don't access any internal variable (avoid recursion!)
                if name[0] != "_" and name in self._NAMES:
                    return self[self._NAMES.index(name)]
                return list.__getattribute__(self, name)

        # copy the current data
        user_data = list(self._userdata[:])
        for key, value in override.items():
            user_data[DummyUserData._NAMES.index(key)] = value
        self._userdata = DummyUserData(user_data)
        self._db = UserDB(self)

    def cleanRandomHome(self):
        try:
            # make sure the home is a temporary one!!!
            shutil.rmtree(self._random_home)
        except (FileNotFoundError, OSError):
            pass
