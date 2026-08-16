# Science Palette Studio

一个本地科研配色工作台。当前包含 9 套 7、8、9、10 色方案，并按离散色库与渐变色库分类；每套色库都有 16 种由 Python/Matplotlib 重新绘制的科研图预览。

## 功能

- 按颜色数量选择色库
- 区分无序离散色库与保留原始色序的连续渐变色库
- 启用或停用色库中任意颜色，确认后由 Python 重新绘制预览
- 预览分布、趋势、比较、矩阵、多维、径向和网络类科研图
- 复制单个 HEX 颜色或当前颜色组合的 Python 配置
- 导出 JSON 或包含所有 SVG/PNG 预览的 ZIP

## 架构

- `data/palettes.json`：版本化色库目录
- `src/scientific_palette_studio`：数据模型、子集组合、Python 渲染器和 FastAPI
- `frontend`：React + TypeScript + Vite 工作台
- `generated/previews`：由 Python 生成的 SVG/PNG 图形资产与子集缓存
- `docs/plotting_manual.md`：所有现有和未来图型必须遵守的绘图规则

## 启动

在 PowerShell 中运行：

```powershell
.\start.ps1
```

然后打开 `http://127.0.0.1:8770`。

## 演示数据声明

所有科研图预览使用固定随机种子生成的演示数据，只用于检查色彩在不同视觉编码中的表现，不表达任何科学结论。
