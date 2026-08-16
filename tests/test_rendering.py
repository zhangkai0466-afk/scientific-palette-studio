import matplotlib.pyplot as plt

from scientific_palette_studio.catalog import get_palette
from scientific_palette_studio.rendering import (
    _error_bars,
    compose_palette,
    render_chart,
    selection_key,
    subset_palette,
)


def test_palette_can_be_reduced_to_one_or_more_colors() -> None:
    palette = get_palette("pelagic-bloom-7")
    selected = subset_palette(palette, [0, 3, 6])
    assert selected.count == 3
    assert selected.hex_colors == ["#6A5C95", "#A9C8B8", "#5B608C"]
    assert selection_key(palette, [0, 3, 6]) == "colors-1-4-7"


def test_single_color_heatmap_renders(tmp_path) -> None:
    palette = subset_palette(get_palette("pelagic-bloom-7"), [2])
    paths = render_chart(palette, "clustered-heatmap", tmp_path)
    assert all(path.exists() and path.stat().st_size > 0 for path in paths)


def test_filled_bars_do_not_have_outline() -> None:
    palette = get_palette("pelagic-bloom-7")
    fig = _error_bars(palette)
    try:
        bar_patches = fig.axes[0].patches
        assert bar_patches
        assert all(patch.get_edgecolor()[-1] == 0 for patch in bar_patches)
    finally:
        plt.close(fig)


def test_main_and_extension_colors_are_combined_without_duplicate_hex_values() -> None:
    palette = get_palette("aqua-apricot-4")
    selected = compose_palette(palette, [0, 1, 2, 3], [0, 7, 9])
    assert selected.hex_colors == [
        "#D6F0F1",
        "#F9E8D4",
        "#4EA8C0",
        "#FFA453",
        "#E9F6F7",
        "#B55516",
    ]
    assert selected.extension_groups == ()


def test_selection_key_distinguishes_extension_combinations() -> None:
    palette = get_palette("aqua-apricot-4")
    assert selection_key(palette, [0, 1, 2, 3]) == "all"
    assert selection_key(palette, [0, 1, 2, 3], [0]) == "colors-1-2-3-4--extensions-1"
    assert selection_key(palette, [], [0, 9]) == "colors-none--extensions-1-10"


def test_extension_only_selection_renders(tmp_path) -> None:
    palette = compose_palette(get_palette("aqua-apricot-4"), [], [0, 9])
    paths = render_chart(palette, "error-bars", tmp_path)
    assert palette.hex_colors == ["#E9F6F7", "#B55516"]
    assert all(path.exists() and path.stat().st_size > 0 for path in paths)
