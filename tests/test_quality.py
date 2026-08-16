from scientific_palette_studio.catalog import load_palettes
from scientific_palette_studio.quality import audit_palette, contrast_against_white, hex_to_rgb


def test_white_contrast_is_monotonic_for_black_and_white() -> None:
    assert contrast_against_white(hex_to_rgb("#000000")) == 21.0
    assert contrast_against_white(hex_to_rgb("#FFFFFF")) == 1.0


def test_all_palettes_return_finite_quality_metrics() -> None:
    for palette in load_palettes():
        report = audit_palette(palette)
        assert report.min_delta_e > 0
        assert report.min_deuteranopia_delta_e > 0
        assert report.min_protanopia_delta_e > 0
        assert report.accessibility_tone in {"good", "watch", "review"}

