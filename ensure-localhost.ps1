param(
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
$studioRoot = $PSScriptRoot
$pythonExe = Join-Path $studioRoot ".venv\Scripts\python.exe"
$stdoutPath = Join-Path $studioRoot ".server.stdout.log"
$stderrPath = Join-Path $studioRoot ".server.stderr.log"
$healthUrl = "http://localhost:8770/api/health"
$platformUrl = "http://localhost:8770/"

function Test-PlatformReady {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Python environment is missing. Run start.ps1 first."
}

if (-not (Test-PlatformReady)) {
    $startOptions = @{
        FilePath = $pythonExe
        ArgumentList = @("-m", "scientific_palette_studio", "--host", "127.0.0.1", "--port", "8770")
        WorkingDirectory = $studioRoot
        RedirectStandardOutput = $stdoutPath
        RedirectStandardError = $stderrPath
        WindowStyle = "Hidden"
    }
    Start-Process @startOptions

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-PlatformReady) {
            $ready = $true
            break
        }
    }
    if (-not $ready) {
        throw "Platform startup timed out. See $stderrPath."
    }
}

if ($OpenBrowser) {
    Start-Process $platformUrl
}
