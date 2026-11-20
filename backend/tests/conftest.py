import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jev import alerts, decisions  # noqa: E402
from jev.config import load  # noqa: E402

GAMES = {
    "ultra_lotto_6_58": {"name": "Ultra Lotto 6/58", "min_number": 1, "max_number": 58, "numbers_count": 6},
    "super_lotto_6_49": {"name": "Super Lotto 6/49", "min_number": 1, "max_number": 49, "numbers_count": 6},
    "lotto_6_42": {"name": "Lotto 6/42", "min_number": 1, "max_number": 42, "numbers_count": 6},
}


@pytest.fixture
def cfg():
    # The real jev.toml, so a broken config file fails the tests too.
    return load()


@pytest.fixture(autouse=True)
def _clean_logs():
    decisions.reset()
    alerts.reset()
    yield
