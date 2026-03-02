"""Helpers for installing/updating the bundled Webasto Connect Lovelace card."""

from pathlib import Path
import re
import shutil

from .const import (
    CARD_FILENAME,
    CARD_SOURCE_DIR,
    CARD_WWW_SUBDIR,
)

CARD_VERSION_PATTERN = re.compile(
    r"__WEBASTO_CONNECT_CARD_VERSION__\s*=\s*['\"]([^'\"]+)['\"]"
)


def read_card_version(path: Path) -> str | None:
    """Read card version marker directly from the JavaScript bundle."""
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return None

    if match := CARD_VERSION_PATTERN.search(content):
        return match.group(1)

    return None


def should_install_card(
    source_version: str | None,
    installed_version: str | None,
    installed_entry_file: Path,
) -> bool:
    """Determine whether bundled card assets should be installed/updated."""
    if source_version is None:
        return False
    if not installed_entry_file.exists():
        return True
    return installed_version != source_version


def ensure_card_installed(integration_path: Path, www_path: Path) -> tuple[bool, str | None]:
    """Copy bundled card assets into Home Assistant www directory when needed."""
    source_dir = integration_path / CARD_SOURCE_DIR
    source_entry = source_dir / CARD_FILENAME

    source_version = read_card_version(source_entry)
    if source_version is None or not source_entry.exists():
        return False, None

    target_dir = www_path / CARD_WWW_SUBDIR
    target_entry = target_dir / CARD_FILENAME
    installed_version = read_card_version(target_entry)

    if not should_install_card(source_version, installed_version, target_entry):
        return False, source_version

    target_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(source_entry, target_entry)
    return True, source_version
