export type ColorToken = {
  name: string;
  name_en: string;
  hex: string;
  role: string;
};

export type PaletteExtensionGroup = {
  id: string;
  name: string;
  name_en: string;
  colors: ColorToken[];
};

export type QualityReport = {
  min_delta_e: number;
  min_delta_pair: { first: number; second: number; delta_e: number };
  min_deuteranopia_delta_e: number;
  min_protanopia_delta_e: number;
  min_white_contrast: number;
  pale_fill_count: number;
  accessibility_label: string;
  accessibility_tone: "good" | "watch" | "review";
};

export type ChartPreview = {
  id: string;
  name: string;
  name_en: string;
  group: string;
  description: string;
  svg_url: string;
  png_url: string;
};

export type OriginTemplate = {
  id: string;
  name: string;
  name_en: string;
  family: string;
  workflow: string;
  workflow_name: string;
  family_name: string;
  description: string;
  renderer: string;
  input_shape: string;
  analysis_task: string;
  paper_use: string;
  evidence_requirements: string[];
  source: string;
};

export type TemplatePreview = {
  template_id: string;
  svg_url: string;
  png_url: string;
};

export type DataRenderResponse = {
  run_id: string;
  filename: string;
  palette_id: string;
  template_id: string;
  selected_count: number;
  summary: { columns: string[]; row_count: number; family: string };
  svg_url: string;
  png_url: string;
  row_count: number;
};

export type SourceColorReplacement = {
  original: string;
  replacement: string;
  occurrences: number;
};

export type SourceRecolorResponse = {
  palette_id: string;
  palette_name: string;
  source: string;
  replacements: SourceColorReplacement[];
  warnings: string[];
};

export type PaletteRecord = {
  id: string;
  name: string;
  name_en: string;
  kind: "categorical" | "continuous";
  count: number;
  description: string;
  source_note: string;
  background: string;
  ink: string;
  accent_index: number;
  tags: string[];
  colors: ColorToken[];
  extension_groups: PaletteExtensionGroup[];
  quality: QualityReport;
  previews: ChartPreview[];
};

export type RenderResponse = {
  palette_id: string;
  selection_key: string;
  color_indices: number[];
  extension_indices: number[];
  selected_count: number;
  previews: ChartPreview[];
  template?: OriginTemplate | null;
  template_preview?: TemplatePreview | null;
};
