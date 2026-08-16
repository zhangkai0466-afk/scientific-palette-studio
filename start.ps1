$ErrorActionPreference = "Stop"

$studioRoot = $PSScriptRoot
$venvRoot = Join-Path $studioRoot ".venv"
$pythonExe = Join-Path $venvRoot "Scripts\python.exe"
$frontendRoot = Join-Path $studioRoot "frontend"

if (-not (Test-Path -LiteralPath $pythonExe)) {
    python -m venv --system-site-packages $venvRoot
}

& $pythonExe -m pip install -e $studioRoot

Push-Location $frontendRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot "node_modules"))) {
        npm install
    }
    npm run build
}
finally {
    Pop-Location
}

& $pythonExe -m scientific_palette_studio --port 8770
