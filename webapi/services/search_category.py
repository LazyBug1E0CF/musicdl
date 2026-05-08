"""Maps neutral search categories (song/album/artist) to per-platform
search parameters that the core library's _constructsearchurls methods
accept through their ``rule`` parameter."""

from __future__ import annotations

from enum import Enum
from typing import Any


class SearchCategory(str, Enum):
    SONG = "song"
    ALBUM = "album"
    ARTIST = "artist"


CATEGORY_SEARCH_RULES: dict[SearchCategory, dict[str, dict[str, Any]]] = {
    SearchCategory.SONG: {
        "NeteaseMusicClient": {"type": 1},
        "QQMusicClient": {"search_type": 0},
        "MiguMusicClient": {"searchSwitch": {"song": 1, "album": 0, "singer": 0}},
    },
    SearchCategory.ALBUM: {
        "NeteaseMusicClient": {"type": 10},
        "QQMusicClient": {"search_type": 2},
        "MiguMusicClient": {"searchSwitch": {"song": 0, "album": 1, "singer": 0}},
    },
    SearchCategory.ARTIST: {
        "NeteaseMusicClient": {"type": 100},
        "QQMusicClient": {"search_type": 1},
        "MiguMusicClient": {"searchSwitch": {"song": 0, "album": 0, "singer": 1}},
    },
}


def translate_search_category(
    category: str,
    sources: list[str],
) -> dict[str, dict[str, Any]]:
    """Return ``{source_name: rule_dict}`` for the given category.

    Sources not in the translation table receive ``{}`` (no override),
    preserving their default search behaviour. Invalid category values
    fall back to ``song``.
    """
    try:
        sc = SearchCategory(category)
    except ValueError:
        sc = SearchCategory.SONG

    rules = CATEGORY_SEARCH_RULES[sc]
    return {source: dict(rules.get(source, {})) for source in sources}
