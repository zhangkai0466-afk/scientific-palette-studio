import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleAlert,
  CircleX,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FileJson,
  FlaskConical,
  Grid2X2,
  Layers3,
  LoaderCircle,
  Maximize2,
  Palette,
  Upload,
  X,
} from "lucide-react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import type { ChartPreview, DataRenderResponse, OriginTemplate, PaletteRecord, RenderResponse, SourceRecolorResponse } from "./types";

type TabId = "gallery" | "anatomy" | "code" | "source";
type PaletteKind = PaletteRecord["kind"];
type ToastKind = "success" | "error" | "warning";
type ToastState = { message: string; kind: ToastKind };

const chartGroups = [
  { id: "all", label: "全部" },
  { id: "distribution", label: "分布" },
  { id: "trend", label: "趋势" },
  { id: "comparison", label: "比较" },
  { id: "matrix", label: "矩阵与多维" },
  { id: "radial", label: "径向" },
  { id: "network", label: "关联" },
];

const roleLabels: Record<string, string> = {
  primary: "主数据",
  secondary: "次数据",
  highlight: "强调",
  support: "辅助",
  annotation: "标注",
  start: "起点",
  low: "低段",
  center: "中点",
  high: "高段",
  end: "终点",
  extension: "拓展色",
};

const paletteKindLabels: Record<PaletteKind, string> = {
  categorical: "离散色库",
  continuous: "渐变色库",
};

const pycharmTheme: PrismTheme = {
  plain: { color: "#BCBEC4", backgroundColor: "#191A1C" },
  styles: [
    { types: ["keyword"], style: { color: "#CF8E6D" } },
    { types: ["operator", "punctuation"], style: { color: "#BCBEC4" } },
    { types: ["string", "char"], style: { color: "#6AAB73" } },
    { types: ["comment"], style: { color: "#7A7E85", fontStyle: "italic" } },
    { types: ["number", "boolean"], style: { color: "#2AACB8" } },
    { types: ["function"], style: { color: "#56A8F5" } },
    { types: ["constant"], style: { color: "#BCBEC4" } },
    { types: ["builtin"], style: { color: "#8888C6" } },
    { types: ["class-name"], style: { color: "#BBB083" } },
    { types: ["parameter", "property"], style: { color: "#BCBEC4" } },
  ],
};

function sameIndices(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function selectionQuery(colorIndices: number[], extensionIndices: number[]): string {
  const params = new URLSearchParams();
  params.set("indices", colorIndices.join(","));
  if (extensionIndices.length > 0) params.set("extensions", extensionIndices.join(","));
  return params.toString();
}

function readableHexColor(hex: string): string {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const luminance = (channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114) / 255;
  if (luminance < 0.67) return hex;
  return `rgb(${channels.map((value) => Math.round(value * 0.58)).join(", ")})`;
}

function App() {
  const [palettes, setPalettes] = useState<PaletteRecord[]>([]);
  const [selectedCount, setSelectedCount] = useState(7);
  const [selectedId, setSelectedId] = useState("");
  const [draftIndices, setDraftIndices] = useState<number[]>([]);
  const [appliedIndices, setAppliedIndices] = useState<number[]>([]);
  const [draftExtensionIndices, setDraftExtensionIndices] = useState<number[]>([]);
  const [appliedExtensionIndices, setAppliedExtensionIndices] = useState<number[]>([]);
  const [extensionsExpanded, setExtensionsExpanded] = useState(true);
  const [activePreviews, setActivePreviews] = useState<ChartPreview[]>([]);
  const [tab, setTab] = useState<TabId>("gallery");
  const [chartGroup, setChartGroup] = useState("all");
  const [expandedChart, setExpandedChart] = useState<ChartPreview | null>(null);
  const [pythonCode, setPythonCode] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<OriginTemplate[]>([]);
  const [templateFamily, setTemplateFamily] = useState("all");
  const [templateWorkflow, setTemplateWorkflow] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [appliedTemplateId, setAppliedTemplateId] = useState("");
  const [templatePreview, setTemplatePreview] = useState<{ template_id: string; svg_url: string; png_url: string } | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dataInfo, setDataInfo] = useState<{ filename: string; row_count: number; numeric_columns: { name: string; count: number }[] } | null>(null);
  const [dataRender, setDataRender] = useState<DataRenderResponse | null>(null);
  const [dataRendering, setDataRendering] = useState(false);
  const [sourceCode, setSourceCode] = useState("");
  const [sourceFilename, setSourceFilename] = useState("plot.py");
  const [sourceResult, setSourceResult] = useState<SourceRecolorResponse | null>(null);
  const [sourceRecoloring, setSourceRecoloring] = useState(false);

  useEffect(() => {
    fetch("/api/palettes")
      .then((response) => {
        if (!response.ok) throw new Error("色库服务暂时不可用");
        return response.json();
      })
      .then((data: PaletteRecord[]) => {
        setPalettes(data);
        const firstSeven = data.find((palette) => palette.count === 7) ?? data[0];
        if (firstSeven) {
          setSelectedCount(firstSeven.count);
          setSelectedId(firstSeven.id);
        }
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleTemplates = templates.filter((template) =>
    (templateWorkflow === "all" || template.workflow === templateWorkflow)
    && (templateFamily === "all" || template.family === templateFamily),
  );

  useEffect(() => {
    if (visibleTemplates.length > 0 && !visibleTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(visibleTemplates[0].id);
    }
  }, [selectedTemplateId, visibleTemplates]);

  useEffect(() => {
    fetch("/api/templates")
      .then((response) => response.json())
      .then((data: OriginTemplate[]) => {
        setTemplates(data);
        if (data[0]) setSelectedTemplateId(data[0].id);
      })
      .catch(() => setTemplates([]));
  }, []);

  const selected = useMemo(
    () => palettes.find((palette) => palette.id === selectedId) ?? palettes.find((palette) => palette.count === selectedCount),
    [palettes, selectedCount, selectedId],
  );
  const availableCounts = useMemo(
    () => [...new Set(palettes.map((palette) => palette.count))].sort((left, right) => left - right),
    [palettes],
  );
  const palettesForCount = useMemo(
    () => palettes.filter((palette) => palette.count === selectedCount),
    [palettes, selectedCount],
  );

  useEffect(() => {
    if (!selected) return;
    const allIndices = selected.colors.map((_, index) => index);
    setDraftIndices(allIndices);
    setAppliedIndices(allIndices);
    setDraftExtensionIndices([]);
    setAppliedExtensionIndices([]);
    setExtensionsExpanded(true);
    setActivePreviews(selected.previews);
    setChartGroup("all");
    fetch(`/api/palettes/${selected.id}/python?${selectionQuery(allIndices, [])}`)
      .then((response) => response.text())
      .then(setPythonCode)
      .catch(() => setPythonCode(""));
  }, [selected]);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.kind === "error" ? 5000 : 2500;
    const timer = window.setTimeout(() => setToast(null), duration);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, kind: ToastKind = "success") => setToast({ message, kind });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedChart(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const chooseCount = (count: number) => {
    setSelectedCount(count);
    const first = palettes.find((palette) => palette.count === count);
    if (first) setSelectedId(first.id);
  };

  const choosePalette = (paletteId: string) => {
    setSelectedId(paletteId);
    setTab("gallery");
  };

  const toggleColor = (index: number) => {
    setDraftIndices((current) => {
      if (current.includes(index)) {
        if (current.length + draftExtensionIndices.length === 1) {
          showToast("至少保留一种颜色", "warning");
          return current;
        }
        return current.filter((value) => value !== index);
      }
      return [...current, index].sort((left, right) => left - right);
    });
  };

  const toggleExtensionColor = (index: number) => {
    setDraftExtensionIndices((current) => {
      if (current.includes(index)) {
        if (current.length + draftIndices.length === 1) {
          showToast("至少保留一种颜色", "warning");
          return current;
        }
        return current.filter((value) => value !== index);
      }
      return [...current, index].sort((left, right) => left - right);
    });
  };

  const applySelection = async () => {
    if (!selected || draftIndices.length + draftExtensionIndices.length === 0) return;
    setRendering(true);
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palette_id: selected.id,
          color_indices: draftIndices,
          extension_indices: draftExtensionIndices,
          template_id: selectedTemplateId || undefined,
        }),
      });
      if (!response.ok) throw new Error("预览刷新失败");
      const result: RenderResponse = await response.json();
      setAppliedIndices(result.color_indices);
      setAppliedExtensionIndices(result.extension_indices);
      setActivePreviews(result.previews);
      setTemplatePreview(result.template_preview ?? null);
      setAppliedTemplateId(result.template?.id ?? "");
      const codeResponse = await fetch(
        `/api/palettes/${selected.id}/python?${selectionQuery(result.color_indices, result.extension_indices)}`,
      );
      setPythonCode(await codeResponse.text());
      showToast(`已使用 ${result.selected_count} 种颜色重新绘制`);
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "预览刷新失败", "error");
    } finally {
      setRendering(false);
    }
  };

  const inspectDataFile = async (file: File | null) => {
    setDataFile(file);
    setDataInfo(null);
    setDataRender(null);
    if (!file) return;
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/data/inspect", { method: "POST", body });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        const detail = payload?.detail ? `：${payload.detail}` : `（错误码 ${response.status}）`;
        throw new Error(`无法读取数据文件${detail}`);
      }
      setDataInfo(await response.json());
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "无法读取数据文件，请检查文件格式", "error");
    }
  };

  const renderUploadedData = async () => {
    if (!selected || !dataFile || !selectedTemplateId) return;
    setDataRendering(true);
    try {
      const body = new FormData();
      body.append("file", dataFile);
      body.append("palette_id", selected.id);
      body.append("template_id", selectedTemplateId);
      body.append("color_indices", draftIndices.join(","));
      body.append("extension_indices", draftExtensionIndices.join(","));
      const response = await fetch("/api/render-data", { method: "POST", body });
      if (!response.ok) throw new Error(await response.text());
      setDataRender(await response.json());
      showToast("已按当前颜色和模板生成真实数据图");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "真实数据绘图失败", "error");
    } finally {
      setDataRendering(false);
    }
  };

  const importSourceFile = async (file: File | null) => {
    setSourceResult(null);
    if (!file) return;
    setSourceFilename(file.name || "plot.py");
    try {
      setSourceCode(await file.text());
    } catch {
      showToast("无法读取 Python 源码文件", "error");
    }
  };

  const recolorSource = async () => {
    if (!sourceCode.trim()) {
      showToast("请先导入或粘贴 Python 源码", "warning");
      return;
    }
    if (!selected) return;
    setSourceRecoloring(true);
    try {
      const response = await fetch("/api/source/recolor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palette_id: selected.id, source: sourceCode }),
      });
      const payload = await response.json().catch(() => null) as { detail?: string } | SourceRecolorResponse | null;
      if (!response.ok) throw new Error((payload as { detail?: string } | null)?.detail || "源码改色失败");
      setSourceResult(payload as SourceRecolorResponse);
      showToast("已按当前色库完成源码改色");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "源码改色失败", "error");
    } finally {
      setSourceRecoloring(false);
    }
  };

  const copyText = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    showToast(message);
  };

  if (loading) {
    return (
      <main className="state-page">
        <FlaskConical size={28} strokeWidth={1.5} />
        <span>正在载入色库与 Python 预览...</span>
      </main>
    );
  }

  if (error || !selected) {
    return <main className="state-page error-state">{error || "没有可用色库"}</main>;
  }

  const filteredCharts = activePreviews.filter((preview) => chartGroup === "all" || preview.group === chartGroup);
  const extensionColors = selected.extension_groups.flatMap((group) => group.colors);
  const currentSelectionQuery = selectionQuery(appliedIndices, appliedExtensionIndices);
  const selectionChanged = !sameIndices(draftIndices, appliedIndices)
    || !sameIndices(draftExtensionIndices, appliedExtensionIndices)
    || selectedTemplateId !== appliedTemplateId;
  const allSelected = draftIndices.length === selected.count;
  const allExtensionsSelected = extensionColors.length > 0 && draftExtensionIndices.length === extensionColors.length;
  const appliedUniqueCount = new Set([
    ...appliedIndices.flatMap((index) => selected.colors[index] ? [selected.colors[index].hex.toUpperCase()] : []),
    ...appliedExtensionIndices.flatMap((index) => extensionColors[index] ? [extensionColors[index].hex.toUpperCase()] : []),
  ]).size;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><Palette size={20} /></div>
          <div>
            <strong>Science Palette</strong>
            <span>科研配色工作台</span>
          </div>
        </div>

        <section className="side-section">
          <div className="side-label">颜色数量</div>
          <div className="count-switch" role="group" aria-label="选择颜色数量">
            {availableCounts.map((count) => (
              <button key={count} className={selectedCount === count ? "active" : ""} onClick={() => chooseCount(count)}>
                {count} 色
              </button>
            ))}
          </div>
        </section>

        <section className="side-section library-section">
          <div className="side-label">色库</div>
          {(["categorical", "continuous"] as PaletteKind[]).map((kind) => {
            const groupedPalettes = palettesForCount.filter((palette) => palette.kind === kind);
            if (groupedPalettes.length === 0) return null;
            return (
              <div className="palette-group" key={kind}>
                <div className="palette-group-label">{paletteKindLabels[kind]}</div>
                <div className="palette-list">
                  {groupedPalettes.map((palette) => (
                    <button key={palette.id} className={`palette-list-item ${palette.id === selected.id ? "active" : ""}`} onClick={() => choosePalette(palette.id)}>
                      <span className="palette-list-copy">
                        <strong>{palette.name}</strong>
                        <small>{palette.name_en}</small>
                      </span>
                      <span className="palette-count">{palette.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <label className="mobile-palette-picker">
          <span>选择色库</span>
          <select value={selected.id} onChange={(event) => choosePalette(event.target.value)}>
            {(["categorical", "continuous"] as PaletteKind[]).map((kind) => {
              const groupedPalettes = palettesForCount.filter((palette) => palette.kind === kind);
              if (groupedPalettes.length === 0) return null;
              return (
                <optgroup label={paletteKindLabels[kind]} key={kind}>
                  {groupedPalettes.map((palette) => <option value={palette.id} key={palette.id}>{palette.name} · {palette.name_en}</option>)}
                </optgroup>
              );
            })}
          </select>
        </label>

        <div className="sidebar-foot">
          <Database size={16} />
          <span>{palettes.length} 套色库 · 16 种图型</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <div className="eyebrow">PALETTE LIBRARY / {selected.count} COLORS / {selected.kind === "categorical" ? "CATEGORICAL" : "CONTINUOUS"}</div>
            <h1>{selected.name} <span>{selected.name_en}</span></h1>
            <p>{selected.description}</p>
          </div>
          <div className="header-actions">
            <button className="button secondary" onClick={() => copyText(pythonCode, "Python 配置已复制")}>
              <Copy size={17} />复制 Python
            </button>
            <a className="button primary" href={`/api/palettes/${selected.id}/bundle.zip?${currentSelectionQuery}`}>
              <Download size={17} />下载当前组合
            </a>
          </div>
        </header>

        <section className="color-composer" aria-label={`${selected.name}颜色选择`}>
          <div className="composer-heading">
            <div>
              <h2>参与绘图的颜色</h2>
              <span>主色 {draftIndices.length} / {selected.count}{extensionColors.length > 0 ? ` · 拓展色 ${draftExtensionIndices.length} / ${extensionColors.length}` : ""}</span>
            </div>
            <button className="select-all-button" onClick={() => setDraftIndices(selected.colors.map((_, index) => index))} disabled={allSelected}>
              全部启用
            </button>
          </div>
          <div className="composer-body">
            <div className="color-options" role="group" aria-label="启用或停用颜色">
              {selected.colors.map((color, index) => {
                const enabled = draftIndices.includes(index);
                return (
                  <button
                    key={color.hex}
                    className="color-option"
                    aria-pressed={enabled}
                    onClick={() => toggleColor(index)}
                    title={`${enabled ? "停用" : "启用"} ${color.name} ${color.hex}`}
                  >
                    <span className="color-chip" style={{ backgroundColor: color.hex }}>
                      {enabled && <Check size={17} strokeWidth={2.4} />}
                    </span>
                    <strong style={{ color: readableHexColor(color.hex) }}>{color.hex.toUpperCase()}</strong>
                  </button>
                );
              })}
            </div>
            <button className="apply-button" disabled={!selectionChanged || rendering} onClick={applySelection}>
              {rendering ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
              {rendering ? "Python 重绘中" : "确认并刷新"}
            </button>
          </div>
          {selected.extension_groups.length > 0 && (
            <section className="extension-section" aria-label="拓展色">
              <div className="extension-heading">
                <button
                  className="extension-toggle"
                  aria-expanded={extensionsExpanded}
                  onClick={() => setExtensionsExpanded((current) => !current)}
                >
                  <span>
                    <strong>拓展色</strong>
                    <small>{draftExtensionIndices.length} / {extensionColors.length} 已启用</small>
                  </span>
                  {extensionsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="extension-actions">
                  <button
                    className="select-all-button"
                    onClick={() => setDraftExtensionIndices(extensionColors.map((_, index) => index))}
                    disabled={allExtensionsSelected}
                  >
                    全部启用
                  </button>
                  <button
                    className="select-all-button"
                    onClick={() => setDraftExtensionIndices([])}
                    disabled={draftExtensionIndices.length === 0}
                  >
                    全部停用
                  </button>
                </div>
              </div>
              {extensionsExpanded && (
                <div className="extension-groups">
                  {selected.extension_groups.map((group, groupIndex) => {
                    const groupOffset = selected.extension_groups
                      .slice(0, groupIndex)
                      .reduce((total, item) => total + item.colors.length, 0);
                    return (
                      <div className="extension-group" key={group.id}>
                        <div className="extension-group-heading">
                          <strong>{group.name}</strong>
                          <span>{group.name_en}</span>
                        </div>
                        <div className="extension-color-options" role="group" aria-label={group.name}>
                          {group.colors.map((color, colorIndex) => {
                            const index = groupOffset + colorIndex;
                            const enabled = draftExtensionIndices.includes(index);
                            return (
                              <button
                                key={`${group.id}-${color.hex}`}
                                className="color-option extension-color-option"
                                aria-pressed={enabled}
                                onClick={() => toggleExtensionColor(index)}
                                title={`${enabled ? "停用" : "启用"} ${color.name} ${color.hex}`}
                              >
                                <span className="color-chip" style={{ backgroundColor: color.hex }}>
                                  {enabled && <Check size={16} strokeWidth={2.4} />}
                                </span>
                                <strong style={{ color: readableHexColor(color.hex) }}>{color.hex.toUpperCase()}</strong>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </section>

        <nav className="content-tabs" aria-label="色库视图">
          <button className={tab === "gallery" ? "active" : ""} onClick={() => setTab("gallery")}><Grid2X2 size={18} />图型试色</button>
          <button className={tab === "anatomy" ? "active" : ""} onClick={() => setTab("anatomy")}><Layers3 size={18} />色库结构</button>
          <button className={tab === "code" ? "active" : ""} onClick={() => setTab("code")}><Code2 size={18} />调用代码</button>
          <button className={tab === "source" ? "active" : ""} onClick={() => setTab("source")}><Upload size={18} />源码改色</button>
        </nav>

        {tab === "gallery" && (
          <section className="gallery-section" aria-busy={rendering}>
            <div className="section-toolbar">
              <div>
                <h2>科研图型预览</h2>
                <p>{appliedUniqueCount} 种颜色 · {activePreviews.length} 种 Python 图型</p>
              </div>
              <div className="filter-row" role="group" aria-label="筛选图型">
                {chartGroups.map((group) => (
                  <button key={group.id} className={chartGroup === group.id ? "active" : ""} onClick={() => setChartGroup(group.id)}>{group.label}</button>
                ))}
              </div>
            </div>
            <div className="template-toolbar" aria-label="Origin 图形模板">
              <div className="template-toolbar-copy">
                <strong>Origin 图形模板</strong>
                <span>将 Origin Graph Gallery 的图形家族映射为可复用的本地绘图模板。</span>
              </div>
              <select value={templateWorkflow} onChange={(event) => setTemplateWorkflow(event.target.value)} aria-label="Origin 工作流">
                <option value="all">全部工作流（{templates.length} 个模板）</option>
                {[...new Map(templates.map((template) => [template.workflow, template.workflow_name])).entries()].map(([id, name]) => <option value={id} key={id}>{name}</option>)}
              </select>
              <select value={templateFamily} onChange={(event) => setTemplateFamily(event.target.value)} aria-label="模板图形家族">
                <option value="all">全部图形家族</option>
                {[...new Map(visibleTemplates.map((template) => [template.family, template.family_name])).entries()].map(([id, name]) => <option value={id} key={id}>{name}</option>)}
              </select>
              <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} aria-label="选择模板">
                {visibleTemplates.map((template) => <option value={template.id} key={template.id}>{template.name}（{template.name_en}）</option>)}
              </select>
              {templatePreview && templatePreview.template_id === selectedTemplateId && (
                <a className="template-preview-link" href={templatePreview.png_url} download>下载模板预览</a>
              )}
            </div>
            {templatePreview && templatePreview.template_id === selectedTemplateId && (
              <article className="selected-template-preview">
                <img src={templatePreview.svg_url} alt="Selected Origin template preview" />
              </article>
            )}
            {templates.find((template) => template.id === selectedTemplateId) && (
              <p className="template-context">{templates.find((template) => template.id === selectedTemplateId)?.workflow_name} / {templates.find((template) => template.id === selectedTemplateId)?.analysis_task} · {templates.find((template) => template.id === selectedTemplateId)?.paper_use}</p>
            )}
            <section className="data-render-panel" aria-label="真实数据一键出图">
              <div className="section-intro"><h2>真实数据一键出图</h2><p>上传 CSV/TSV 数据，使用当前启用的颜色和模板生成真实图形。</p></div>
              <div className="data-render-controls">
                <label className="file-picker"><span>选择 CSV/TSV 数据</span><input type="file" accept=".csv,.tsv,.tab,text/csv,text/tab-separated-values" onChange={(event) => inspectDataFile(event.target.files?.[0] ?? null)} /></label>
                {dataInfo && <span className="data-summary">{dataInfo.filename} · {dataInfo.row_count} 行 · 数值列：{dataInfo.numeric_columns.map((column) => column.name).join("、")}</span>}
                <button className="button primary" disabled={!dataFile || !dataInfo || dataRendering} onClick={renderUploadedData}>{dataRendering ? <LoaderCircle className="spin" size={17} /> : <FlaskConical size={17} />} 使用当前模板出图</button>
              </div>
              {dataRender && <div className="data-render-result"><div className="data-render-result-head"><strong>{dataRender.filename}</strong><span>{dataRender.summary.row_count} 行 · 数据列：{dataRender.summary.columns.join("、")}</span><a className="button secondary" href={dataRender.png_url} download>下载 PNG</a><a className="button secondary" href={dataRender.svg_url} download>下载 SVG</a></div><img src={dataRender.svg_url} alt="真实数据模板渲染结果" /></div>}
            </section>
            <div className={`chart-grid ${rendering ? "is-rendering" : ""}`}>
              {filteredCharts.map((chart) => (
                <article className="chart-card" key={chart.id}>
                  <button className="chart-image-button" onClick={() => setExpandedChart(chart)} title={`放大查看${chart.name}`}>
                    <img src={chart.svg_url} alt={`${selected.name}在${chart.name}中的预览`} />
                    <span className="expand-icon"><Maximize2 size={17} /></span>
                  </button>
                  <div className="chart-meta">
                    <div><h3>{chart.name}</h3><span>{chart.name_en}</span></div>
                    <p>{chart.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "anatomy" && (
          <section className="anatomy-section">
            <div className="section-intro"><h2>色库结构</h2><p>当前绘图组合已标记，完整色库顺序始终保持不变。</p></div>
            <div className="token-table" role="table" aria-label="颜色角色列表">
              <div className="token-row token-head" role="row"><span>颜色</span><span>名称</span><span>HEX</span><span>{selected.kind === "continuous" ? "渐变位置" : "建议角色"}</span><span>调用索引</span><span>当前</span></div>
              {selected.colors.map((color, index) => (
                <button className="token-row" role="row" key={color.hex} onClick={() => copyText(color.hex, `${color.hex} 已复制`)}>
                  <span className="token-chip" style={{ backgroundColor: color.hex }} />
                  <span><strong>{color.name}</strong><small>{color.name_en}</small></span>
                  <code>{color.hex}</code>
                  <span className={`role role-${color.role}`}>{roleLabels[color.role] ?? color.role}</span>
                  <code>PALETTE[{index}]</code>
                  <span className={`selection-state ${appliedIndices.includes(index) ? "enabled" : ""}`}>
                    {appliedIndices.includes(index) ? "已启用" : "未启用"}
                  </span>
                </button>
              ))}
            </div>
            {selected.extension_groups.length > 0 && (
              <div className="extension-anatomy">
                <div className="section-intro extension-anatomy-intro">
                  <h3>拓展色</h3>
                  <p>按参考图色系分组，导出时仅合并当前已启用的颜色。</p>
                </div>
                {selected.extension_groups.map((group, groupIndex) => {
                  const groupOffset = selected.extension_groups
                    .slice(0, groupIndex)
                    .reduce((total, item) => total + item.colors.length, 0);
                  return (
                    <section className="extension-token-group" key={group.id}>
                      <div className="extension-token-title">
                        <strong>{group.name}</strong>
                        <span>{group.name_en}</span>
                      </div>
                      <div className="token-table" role="table" aria-label={`${group.name}拓展色列表`}>
                        {group.colors.map((color, colorIndex) => {
                          const index = groupOffset + colorIndex;
                          return (
                            <button
                              className="token-row"
                              role="row"
                              key={`${group.id}-${color.hex}`}
                              onClick={() => copyText(color.hex, `${color.hex} 已复制`)}
                            >
                              <span className="token-chip" style={{ backgroundColor: color.hex }} />
                              <span><strong>{color.name}</strong><small>{color.name_en}</small></span>
                              <code>{color.hex}</code>
                              <span className="role">拓展色</span>
                              <code>EXTENSIONS[{index}]</code>
                              <span className={`selection-state ${appliedExtensionIndices.includes(index) ? "enabled" : ""}`}>
                                {appliedExtensionIndices.includes(index) ? "已启用" : "未启用"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            <div className="usage-note">
              <Eye size={20} />
              <div><strong>绘图约束</strong><p>纯色填充不使用黑色描边；需要区分时优先使用留白、透明度、标记和直接标签。</p></div>
            </div>
          </section>
        )}

        {tab === "code" && (
          <section className="code-section">
            <div className="section-toolbar">
              <div><h2>Python 调用代码</h2><p>代码与当前已确认的 {appliedUniqueCount} 种颜色同步。</p></div>
              <div className="header-actions">
                <a className="button secondary" href={`/api/palettes/${selected.id}/json?${currentSelectionQuery}`}><FileJson size={17} />导出 JSON</a>
                <button className="button primary" onClick={() => copyText(pythonCode, "代码已复制")}><Copy size={17} />复制代码</button>
              </div>
            </div>
            <div className="code-editor">
              <div className="code-editor-bar">
                <span className="code-editor-tab"><Code2 size={15} />palette.py</span>
                <span>Python</span>
              </div>
              <Highlight theme={pycharmTheme} code={pythonCode.trimEnd()} language="python">
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`code-block ${className}`} style={style}>
                    {tokens.map((line, lineIndex) => {
                      const lineProps = getLineProps({ line });
                      const lineText = line.map((token) => token.content).join("");
                      const isDefinition = /^\s*def\s+/.test(lineText);
                      const hintedArgument = lineText.includes("LinearSegmentedColormap.from_list(")
                        ? line.findIndex((token) => token.types.includes("string"))
                        : -1;
                      return (
                        <div {...lineProps} className={`code-line ${lineIndex === tokens.length - 1 ? "is-active" : ""}`} key={lineIndex}>
                          <span className="line-number">{lineIndex + 1}</span>
                          <span className="line-content">
                            {line.map((token, tokenIndex) => (
                              <span key={tokenIndex}>
                                {tokenIndex === hintedArgument && <span className="parameter-hint">name:</span>}
                                <span {...getTokenProps({ token })} />
                              </span>
                            ))}
                            {isDefinition && <span className="code-usage">1 个用法</span>}
                          </span>
                        </div>
                      );
                    })}
                  </pre>
                )}
              </Highlight>
            </div>
          </section>
        )}

        {tab === "source" && (
          <section className="source-section">
            <div className="section-toolbar">
              <div><h2>Python 源码一键改色</h2><p>导入绘图源码，静态替换字符串中的 HEX 颜色，保留原有绘图逻辑与注释。</p></div>
              <div className="header-actions">
                <label className="button secondary source-upload-button"><Upload size={17} />导入 .py<input type="file" accept=".py,text/x-python" onChange={(event) => importSourceFile(event.target.files?.[0] ?? null)} /></label>
                <button className="button primary" disabled={!sourceCode.trim() || sourceRecoloring} onClick={recolorSource}>{sourceRecoloring ? <LoaderCircle className="spin" size={17} /> : <Palette size={17} />}一键按当前色库改色</button>
              </div>
            </div>
            <div className="source-layout">
              <div className="source-editor-panel">
                <div className="source-panel-head"><strong>{sourceFilename}</strong><span>{sourceCode.length.toLocaleString()} 字符</span></div>
                <textarea className="source-textarea" value={sourceCode} onChange={(event) => { setSourceCode(event.target.value); setSourceResult(null); }} placeholder={'粘贴 Python 绘图源码，例如：\n\nimport matplotlib.pyplot as plt\nplt.plot(x, y, color="#4EA8C0")'} spellCheck={false} />
              </div>
              <aside className="source-result-panel">
                <div className="source-panel-head"><strong>改色清单</strong><span>{sourceResult ? `${sourceResult.replacements.length} 种颜色` : "待生成"}</span></div>
                {sourceResult ? (
                  <>
                    <div className="replacement-list">
                      {sourceResult.replacements.map((item) => <div className="replacement-row" key={`${item.original}-${item.replacement}`}><span className="replacement-chip" style={{ backgroundColor: item.original }} /><code>{item.original}</code><span className="replacement-arrow">→</span><span className="replacement-chip" style={{ backgroundColor: item.replacement }} /><code>{item.replacement}</code><small>{item.occurrences} 处</small></div>)}
                    </div>
                    {sourceResult.warnings.map((warning) => <p className="source-warning" key={warning}><CircleAlert size={15} />{warning}</p>)}
                    <div className="source-actions"><button className="button secondary" onClick={() => copyText(sourceResult.source, "改色后的源码已复制")}><Copy size={16} />复制结果</button><a className="button primary" href={`data:text/plain;charset=utf-8,${encodeURIComponent(sourceResult.source)}`} download={sourceFilename.replace(/\.py$/i, "") + "-recolored.py"}><Download size={16} />下载 .py</a></div>
                  </>
                ) : <div className="source-empty"><Code2 size={26} /><p>导入或粘贴源码后，点击“一键按当前色库改色”。</p></div>}
              </aside>
            </div>
            {sourceResult && <div className="source-output"><div className="source-panel-head"><strong>改色后的源码</strong><span>已静态替换 HEX 字符串</span></div><Highlight theme={pycharmTheme} code={sourceResult.source.trimEnd()} language="python">{({ className, style, tokens, getLineProps, getTokenProps }) => <pre className={`code-block source-code-block ${className}`} style={style}>{tokens.map((line, lineIndex) => <div {...getLineProps({ line })} className="code-line" key={lineIndex}><span className="line-number">{lineIndex + 1}</span><span className="line-content">{line.map((token, tokenIndex) => <span key={tokenIndex} {...getTokenProps({ token })} />)}</span></div>)}</pre>}</Highlight></div>}
          </section>
        )}
      </main>

      {expandedChart && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setExpandedChart(null)}>
          <section className="chart-modal" role="dialog" aria-modal="true" aria-label={`${expandedChart.name}大图`} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>{selected.name_en}</span><h2>{expandedChart.name}</h2></div><button className="icon-button" onClick={() => setExpandedChart(null)} title="关闭"><X size={20} /></button></header>
            <div className="modal-image"><img src={expandedChart.svg_url} alt={`${expandedChart.name}放大预览`} /></div>
            <footer><p>{expandedChart.description}</p><a className="button primary" href={expandedChart.png_url} download><Download size={17} />下载 PNG</a></footer>
          </section>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
        {toast.kind === "error" ? <CircleX size={18} /> : toast.kind === "warning" ? <CircleAlert size={18} /> : <Check size={18} />}
        <span>{toast.message}</span>
      </div>}
    </div>
  );
}

export default App;
