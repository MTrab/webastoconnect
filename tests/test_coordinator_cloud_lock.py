"""Tests for serialized Webasto cloud operations."""

import asyncio

import pytest

from custom_components.webastoconnect.api import WebastoConnectUpdateCoordinator


def _build_coordinator() -> WebastoConnectUpdateCoordinator:
    """Create a coordinator with only the lock state needed for tests."""
    coordinator = object.__new__(WebastoConnectUpdateCoordinator)
    coordinator._cloud_operation_lock = asyncio.Lock()
    return coordinator


@pytest.mark.asyncio
async def test_async_execute_cloud_call_serializes_parallel_calls() -> None:
    """Parallel cloud calls must execute one at a time."""
    coordinator = _build_coordinator()
    order: list[str] = []
    running = False
    overlap_detected = False

    async def cloud_call(marker: str) -> None:
        nonlocal running, overlap_detected
        if running:
            overlap_detected = True
        running = True
        order.append(f"start-{marker}")
        await asyncio.sleep(0.01)
        order.append(f"end-{marker}")
        running = False

    await asyncio.gather(
        coordinator.async_execute_cloud_call(cloud_call, "a"),
        coordinator.async_execute_cloud_call(cloud_call, "b"),
    )

    assert overlap_detected is False
    assert order in [
        ["start-a", "end-a", "start-b", "end-b"],
        ["start-b", "end-b", "start-a", "end-a"],
    ]
