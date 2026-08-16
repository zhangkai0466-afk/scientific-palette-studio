from scientific_palette_studio.catalog import get_palette, load_palettes, palette_python_source


def test_catalog_contains_imported_palette_counts_and_kinds() -> None:
    palettes = load_palettes()
    assert len(palettes) == 13
    assert {palette.count for palette in palettes} == {4, 6, 7, 8, 9, 10}
    assert {palette.kind for palette in palettes} == {"categorical", "continuous"}
    assert all(len(palette.colors) == palette.count for palette in palettes)


def test_python_export_is_directly_importable() -> None:
    source = palette_python_source(get_palette("pelagic-bloom-7"))
    namespace: dict = {}
    exec(source, namespace)
    assert len(namespace["PALETTE"]) == 7
    assert namespace["ACCENT"] == "#E7A889"
    assert namespace["PALETTE_KIND"] == "categorical"
    assert namespace["as_categorical"]().N == 7


def test_continuous_palette_preserves_reference_order() -> None:
    palette = get_palette("arctic-crimson-10")
    assert palette.kind == "continuous"
    assert palette.hex_colors[0] == "#104680"
    assert palette.hex_colors[-1] == "#6D011F"


def test_teal_ember_is_nine_colors_without_removed_clay_sand() -> None:
    palette = get_palette("teal-ember-9")
    assert palette.count == 9
    assert "#CE9E85" not in palette.hex_colors
    assert palette.hex_colors[-2:] == ["#EA9C73", "#D98A63"]


def test_blossom_sage_is_ordered_as_a_green_to_pink_gradient() -> None:
    palette = get_palette("blossom-sage-8")
    assert palette.kind == "continuous"
    assert palette.hex_colors == [
        "#6BAA7A",
        "#B7E1C1",
        "#C8EAD5",
        "#DFF2E3",
        "#D9E6D2",
        "#FFF6E3",
        "#FAD6DE",
        "#F7BFCB",
    ]
    assert [color.role for color in palette.colors] == [
        "start",
        "low",
        "low",
        "low",
        "center",
        "center",
        "high",
        "end",
    ]


def test_four_new_palettes_preserve_reference_hex_order() -> None:
    expected = {
        "aqua-apricot-4": ["#D6F0F1", "#F9E8D4", "#4EA8C0", "#FFA453"],
        "coral-mist-6": ["#F0A3A0", "#F5B8B0", "#F9D8C4", "#DDE6CD", "#B8D1C8", "#A2C2D2"],
        "teal-coral-scale-7": ["#56A0AB", "#86B9C3", "#E6CBC6", "#F2BAB7", "#D69B95", "#C97064", "#FF7C66"],
        "teal-grey-apricot-7": ["#58878A", "#ACD0D4", "#CFE3E4", "#D1D1C4", "#CC8264", "#ECBEAA", "#FCEBE2"],
    }
    for palette_id, hex_colors in expected.items():
        assert get_palette(palette_id).hex_colors == hex_colors


def test_aqua_apricot_extension_groups_preserve_reference_values() -> None:
    palette = get_palette("aqua-apricot-4")
    assert [group.name for group in palette.extension_groups] == ["青蓝系", "橙橘系", "中性色"]
    assert [[color.hex.upper() for color in group.colors] for group in palette.extension_groups] == [
        ["#E9F6F7", "#BDE2EA", "#4EABC0", "#2F7F95", "#1B5666"],
        ["#FFF1E2", "#FFD7B3", "#FFA453", "#E67E22", "#B55516"],
        ["#F7F7F7", "#E5E7EB", "#CBD5E1", "#64748B", "#334155"],
    ]
