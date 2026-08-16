# Scientific preview figure contract

Core conclusion: a palette is useful only when it stays coherent and readable across common scientific encodings.

- Figure archetype: `quantitative grid`
- Target output: local web preview plus editable SVG and high-resolution PNG
- Backend: Python only
- Final preview size: 5.4 x 3.4 inches per chart
- Hero evidence: categorical color strip and cross-chart consistency
- Validation evidence: distribution, trend, matrix, spectral and radial chart previews
- Statistics: deterministic synthetic demonstration data; no scientific claim is implied
- Source data: generated in the renderer with fixed seeds
- Image integrity: reference images are not embedded or altered; only the visible palettes are manually reconstructed
- Reviewer risk: similar colors require markers, direct labels, whitespace or line styles; black outlines around solid data fills are forbidden by `PS-FILL-001`
