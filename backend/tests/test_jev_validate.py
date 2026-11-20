from datetime import date

import pytest

from jev.config import JevConfigError, parse
from jev.validate import Candidate, Rejected, column_map, validate_row
from tests.conftest import GAMES

HEADER = ["LOTTO GAME", "COMBINATIONS", "DRAW DATE", "JACKPOT (PHP)", "WINNERS"]
COLS = column_map(HEADER)
TODAY = date(2026, 10, 28)  # Wednesday
SAT = [1, 4, 6]  # 6/58: Tue, Fri, Sun


def check(cells, game="ultra_lotto_6_58", **kw):
    args = dict(today=TODAY, draw_days=SAT, no_draw_dates=frozenset(), hold_off_schedule=True)
    args.update(kw)
    return validate_row(game, GAMES[game], COLS, cells, **args)


def test_valid_row_is_sorted_and_parsed():
    c = check(["Ultra Lotto 6/58", "14-38-44-25-52-47", "10/27/2026", "430,857,884.28", "0"])
    assert isinstance(c, Candidate)
    assert c.numbers == (14, 25, 38, 44, 47, 52)
    assert c.draw_date == date(2026, 10, 27)
    assert c.jackpot == 430857884.28 and c.winners == 0
    assert c.to_db_row()["draw_number"] == "14-25-38-44-47-52"
    assert c.to_db_row()["draw_date"] == "2026-10-27T00:00:00"


def test_blank_row_is_ignored():
    assert check(["", "", "", "", ""]) is None
    assert check([]) is None


def test_row_still_being_typed_is_skipped_not_alerted():
    assert check(["Ultra Lotto 6/58", "", "", "", ""]) is None
    assert check(["Ultra Lotto 6/58", "14-38-44-25-52-47", "", "", ""]) is None
    assert check(["Ultra Lotto 6/58", "", "10/27/2026", "", ""]) is None


@pytest.mark.parametrize("combo,reason", [
    ("14-38-44-25-52", "has 5 numbers"),
    ("14-38-44-25-52-47-01", "has 7 numbers"),
    ("14-38-44-25-52-52", "repeated"),
    ("14-38-44-25-52-59", "outside 1-58"),
    ("00-38-44-25-52-47", "outside 1-58"),
    ("14-38-4a-25-52-47", "not a whole number"),
])
def test_bad_numbers_are_rejected(combo, reason):
    r = check(["Ultra Lotto 6/58", combo, "10/27/2026", "", "0"])
    assert isinstance(r, Rejected) and not r.hold
    assert any(reason in x for x in r.reasons), r.reasons


def test_range_follows_the_game():
    assert isinstance(check(["Lotto 6/42", "01-02-03-04-05-43", "10/27/2026", "", ""], game="lotto_6_42",
                            draw_days=[1, 3, 5]), Rejected)
    assert isinstance(check(["Lotto 6/42", "01-02-03-04-05-42", "10/27/2026", "", ""], game="lotto_6_42",
                            draw_days=[1, 3, 5]), Candidate)


def test_wrong_game_name_is_rejected():
    r = check(["Lotto 6/42", "01-02-03-04-05-06", "10/27/2026", "", ""])
    assert isinstance(r, Rejected) and "doesn't match" in r.reasons[0]


def test_game_name_spacing_variants_match():
    # The 6/49 Sheet writes "Superlotto 6/49"; config says "Super Lotto 6/49".
    c = check(["Superlotto 6/49", "03-16-11-35-04-30", "10/27/2026", "", ""], game="super_lotto_6_49", draw_days=[1, 3, 6])
    assert isinstance(c, Candidate)


@pytest.mark.parametrize("value,reason", [
    ("10/29/2026", "in the future"),
    ("13/10/2026", "not a valid"),  # day-first is not accepted
    ("yesterday", "not a valid"),
])
def test_bad_dates_are_rejected(value, reason):
    r = check(["Ultra Lotto 6/58", "01-02-03-04-05-06", value, "", ""])
    assert isinstance(r, Rejected) and any(reason in x for x in r.reasons), r.reasons


def test_off_schedule_date_is_held_not_dropped():
    r = check(["Ultra Lotto 6/58", "01-02-03-04-05-06", "10/26/2026", "", ""])  # Monday
    assert isinstance(r, Rejected) and r.hold
    assert "not a draw day" in r.reasons[0]
    # With the rule off, the same row is accepted.
    assert isinstance(check(["Ultra Lotto 6/58", "01-02-03-04-05-06", "10/26/2026", "", ""], hold_off_schedule=False), Candidate)


def test_no_draw_date_is_held():
    r = check(["Ultra Lotto 6/58", "01-02-03-04-05-06", "10/27/2026", "", ""], no_draw_dates=frozenset({date(2026, 10, 27)}))
    assert isinstance(r, Rejected) and r.hold


def test_bad_money_and_winners_are_rejected():
    r = check(["Ultra Lotto 6/58", "01-02-03-04-05-06", "10/27/2026", "lots", "2.5"])
    assert isinstance(r, Rejected) and len(r.reasons) == 2


def test_sheets_date_serial_is_accepted():
    c = check(["Ultra Lotto 6/58", "01-02-03-04-05-06", 46322, "", ""])  # 46322 = 2026-10-27
    assert isinstance(c, Candidate) and c.draw_date == date(2026, 10, 27)


def test_header_without_numbers_column_fails_loudly():
    with pytest.raises(ValueError):
        column_map(["LOTTO GAME", "DRAW DATE"])


def test_config_rejects_unknown_handler(cfg):
    import tomllib
    from jev.config import CONFIG_PATH

    raw = tomllib.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    raw["routes"]["miro_pick"]["fallback"] = ["llm:huge"]
    with pytest.raises(JevConfigError):
        parse(raw)
    raw = tomllib.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    del raw["sync"]
    with pytest.raises(JevConfigError):
        parse(raw)


def test_real_config_loads(cfg):
    assert cfg.route("miro_pick").chain[0] == "llm:large"
    assert cfg.route("validate_result").chain == ("code:validate",)
    assert set(cfg.draw_days) >= set(GAMES)
