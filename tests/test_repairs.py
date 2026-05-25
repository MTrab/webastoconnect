"""Tests for Webasto repairs."""

from types import SimpleNamespace

import pytest

from custom_components.webastoconnect.repairs import async_create_fix_flow


@pytest.mark.asyncio
async def test_pending_approval_repair_reloads_entry() -> None:
    """Repair flow should reload the config entry when continued."""
    scheduled: list[str] = []
    flow = await async_create_fix_flow(
        SimpleNamespace(),
        "pending_approval",
        {"entry_id": "entry-1"},
    )
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_schedule_reload=scheduled.append)
    )

    result = await flow.async_step_confirm({})

    assert scheduled == ["entry-1"]
    assert result["type"] == "create_entry"
