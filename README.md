# Science Palette Studio

一个本地科研配色工作台。当前包含 17 套 4、6、7、8、9、10 色方案，并按离散色库与渐变色库分类；每套色库都有 16 种由 Python/Matplotlib 重新绘制的科研图预览。

完整平台采用 Python 后端，不能仅用 GitHub Pages 运行。公开部署采用 GitHub 托管代码、Ubuntu 服务器运行 Docker Compose、Caddy 提供 HTTPS，操作见 [部署指南](DEPLOYMENT.md)。当前选用武汉服务器，域名完成 ICP 备案后再公开上线。

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

Windows 日常使用由 `launch-hidden.vbs` 无窗口调用 `ensure-localhost.ps1`，在后台检查并启动本地服务。开机快捷方式使用 `wscript.exe //B //NoLogo "完整路径\launch-hidden.vbs"`；桌面快捷方式在末尾增加 `-OpenBrowser`，等待服务就绪后打开网页。服务已运行时会直接复用，不会重复启动。服务日志保存在 `.server.stdout.log` 和 `.server.stderr.log`。

## 演示数据声明

所有科研图预览使用固定随机种子生成的演示数据，只用于检查色彩在不同视觉编码中的表现，不表达任何科学结论。
