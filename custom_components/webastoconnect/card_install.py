"""Helpers for installing/updating the bundled Webasto Connect Lovelace card."""

from pathlib import Path
import shutil

from .const import (
    CARD_FILENAME,
    CARD_SOURCE_DIR,
    CARD_SOURCE_VERSION_FILE,
    CARD_VERSION_FILENAME,
    CARD_WWW_SUBDIR,
)


def read_version_file(path: Path) -> str | None:
    """Read a version marker file, returning None when missing/empty."""
    try:
        value = path.read_text(encoding="utf-8").strip()
    except OSError:
        return None
    return value or None


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
    source_version_file = source_dir / CARD_SOURCE_VERSION_FILE

    source_version = read_version_file(source_version_file)
    if source_version is None or not source_entry.exists():
        return False, None

    target_dir = www_path / CARD_WWW_SUBDIR
    target_entry = target_dir / CARD_FILENAME
    target_version_file = target_dir / CARD_VERSION_FILENAME
    installed_version = read_version_file(target_version_file)

    if not should_install_card(source_version, installed_version, target_entry):
        return False, source_version

    target_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(source_entry, target_entry)

    target_version_file.write_text(source_version, encoding="utf-8")
    return True, source_version
