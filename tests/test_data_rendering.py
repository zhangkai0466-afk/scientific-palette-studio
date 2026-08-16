from pathlib import Path

import pytest
from matplotlib.axes import Axes
from matplotlib.colors import Colormap, to_hex

from scientific_palette_studio.catalog import get_palette
from scientific_palette_studio.data_rendering import render_data_template
from scientific_palette_studio.rendering import subset_palette


@pytest.mark.parametrize(
    ("template_id", "numeric", "expected_mode", "expected_axis"),
    [
        (
            "origin-network-with-labels",
            {"source_node": [1, 1, 2, 3], "target_node": [2, 3, 4, 4], "weight": [0.8, 0.4, 0.9, 0.6]},
            "weighted-network",
            None,
        ),
        (
            "origin-survival-comparison",
            {"time_days": [0, 5, 10, 15], "control": [1.0, 0.82, 0.61, 0.45], "treatment": [1.0, 0.91, 0.79, 0.68]},
            "survival-step",
            "time_days",
        ),
        (
            "origin-scientific-publication",
            {"wavelength_nm": [400, 500, 600, 700], "observed_signal": [1.0, 2.8, 1.9, 0.7], "fitted_total": [0.9, 2.7, 2.0, 0.8]},
            "spectral-components",
            "wavelength_nm",
        ),
        (
            "origin-control-with-error",
            {"sample_index": [1, 2, 3, 4], "measurement": [10.1, 9.9, 10.2, 10.0], "center_line": [10.0] * 4, "ucl": [10.5] * 4, "lcl": [9.5] * 4},
            "control-limits",
            "sample_index",
        ),
        (
            "origin-polar-comparison",
            {"model_id": [1, 2, 3], "accuracy": [82, 91, 87], "robustness": [78, 84, 93], "speed": [95, 72, 81]},
            "radar-comparison",
            None,
        ),
        (
            "origin-multivariate-normalized",
            {"model_id": [1, 2, 3], "accuracy": [82, 91, 87], "robustness": [78, 84, 93], "speed": [95, 72, 81]},
            "parallel-coordinates",
            None,
        ),
        (
            "origin-area-stacked",
            {"time_month": [1, 2, 3, 4], "component_a": [4, 5, 6, 7], "component_b": [3, 4, 4, 5]},
            "area",
            "time_month",
        ),
    ],
)
def test_complex_template_families_use_semantic_renderers(
    tmp_path: Path,
    template_id: str,
    numeric: dict[str, list[float]],
    expected_mode: str,
    expected_axis: str | None,
) -> None:
    paths, summary = render_data_template(
        get_palette("teal-ember-9"),
        template_id,
        numeric,
        tmp_path / template_id,
    )
    assert summary["chart_mode"] == expected_mode
    assert summary["axis_column"] == expected_axis
    assert all(path.exists() and path.stat().st_size > 1_000 for path in paths)


def test_matrix_renderer_uses_selected_palette(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    palette = subset_palette(get_palette("pelagic-bloom-7"), [0, 3, 6])
    captured: dict[str, object] = {}
    original_imshow = Axes.imshow

    def capture_imshow(self: Axes, *args: object, **kwargs: object):
        captured["cmap"] = kwargs.get("cmap")
        return original_imshow(self, *args, **kwargs)

    monkeypatch.setattr(Axes, "imshow", capture_imshow)
    render_data_template(
        palette,
        "origin-matrix-publication",
        {
            "sample_index": [1, 2, 3, 4],
            "temperature": [10, 12, 15, 17],
            "pressure": [30, 28, 24, 20],
            "efficiency": [0.42, 0.55, 0.69, 0.81],
        },
        tmp_path / "matrix-selected-palette",
    )

    cmap = captured["cmap"]
    assert isinstance(cmap, Colormap)
    assert to_hex(cmap(0.0)).upper() == palette.hex_colors[0]
    assert to_hex(cmap(1.0)).upper() == palette.hex_colors[-1]
