"""Ingest dummy data into the solr server."""

import logging
from pathlib import Path

from evaluation_system.misc import config, logger
from evaluation_system.model.solr_core import SolrCore

if __name__ == "__main__":
    logger.setLevel(logging.INFO)
    config.reloadConfiguration()
    SolrCore.load_fs(
        Path(".").absolute() / ".docker" / "data",
        abort_on_errors=True,
    )
