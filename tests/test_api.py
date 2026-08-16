import json

from fastapi.testclient import TestClient

from scientific_palette_studio.api import app, export_json, export_python
from scientific_palette_studio.source_recolor import recolor_source
from scientific_palette_studio.catalog import get_palette


client = TestClient(app)


def test_templates_endpoint_returns_all_structured_templates() -> None:
    response = client.get("/api/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) == 108
    assert templates[0]["evidence_requirements"] == [
        "source artifact or reproducible result",
        "units and grouping definition",
        "caption boundary",
    ]


def test_data_inspection_rejects_unsupported_files_in_chinese() -> None:
    response = client.post(
        "/api/data/inspect",
        files={"file": ("notes.txt", b"value\n1\n2\n", "text/plain")},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "仅支持 CSV 和 TSV 数据文件"}


def test_python_export_contains_enabled_extension_colors() -> None:
    response = export_python("aqua-apricot-4", indices="0,2", extensions="0,9")
    source = response.body.decode("utf-8")
    namespace: dict = {}
    exec(source, namespace)
    assert namespace["PALETTE"] == ["#D6F0F1", "#4EA8C0", "#E9F6F7", "#B55516"]


def test_json_export_contains_enabled_extension_colors() -> None:
    response = export_json("aqua-apricot-4", indices="3", extensions="7,14")
    payload = json.loads(response.body)
    assert [color["hex"] for color in payload["colors"]] == ["#FFA453", "#334155"]
    assert payload["count"] == 2
    assert payload["extension_groups"] == []


def test_source_recolor_replaces_hex_colors_only_inside_python_strings() -> None:
    source = '''import matplotlib.pyplot as plt\n\n# keep #ABCDEF in comments\nplt.plot([1, 2], color="#abc", markerfacecolor="#ABCDEF")\n'''
    response = client.post("/api/source/recolor", json={"palette_id": "aqua-apricot-4", "source": source})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == '''import matplotlib.pyplot as plt\n\n# keep #ABCDEF in comments\nplt.plot([1, 2], color="#D6F0F1", markerfacecolor="#F9E8D4")\n'''
    assert payload["replacements"] == [
        {"original": "#AABBCC", "replacement": "#D6F0F1", "occurrences": 1},
        {"original": "#ABCDEF", "replacement": "#F9E8D4", "occurrences": 1},
    ]


def test_source_recolor_rejects_invalid_python() -> None:
    response = client.post("/api/source/recolor", json={"palette_id": "aqua-apricot-4", "source": "plt.plot("})
    assert response.status_code == 400
    assert "语法无效" in response.json()["detail"]


def test_source_recolor_cycles_palette_with_warning() -> None:
    source = "colors = ['#000001', '#000002', '#000003', '#000004', '#000005']\n"
    rewritten, replacements, warnings = recolor_source(source, get_palette("aqua-apricot-4"))
    assert rewritten.count("#D6F0F1") == 2
    assert len(replacements) == 5
    assert warnings
