param(
    [switch]$Clean,
    [switch]$OpenPdf
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mainFile = Join-Path $projectDir "main.tex"
$pdfFile = Join-Path $projectDir "main.pdf"
$logFile = Join-Path $projectDir "main.log"

function Test-Tool {
    param([Parameter(Mandatory = $true)][string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Remove-BuildArtifacts {
    param([Parameter(Mandatory = $true)][string]$Path)

    $patterns = @(
        "*.aux",
        "*.fdb_latexmk",
        "*.fls",
        "*.lof",
        "*.log",
        "*.lot",
        "*.out",
        "*.synctex.gz",
        "*.toc"
    )

    foreach ($pattern in $patterns) {
        Get-ChildItem -Path $Path -Filter $pattern -File -ErrorAction SilentlyContinue |
            Remove-Item -Force -ErrorAction SilentlyContinue
    }
}

function Show-LatexErrors {
    param([Parameter(Mandatory = $true)][string]$LogPath)

    if (-not (Test-Path -LiteralPath $LogPath)) {
        return
    }

    $logLines = Get-Content -LiteralPath $LogPath -ErrorAction SilentlyContinue
    if (-not $logLines) {
        return
    }

    $errorIndexes = for ($i = 0; $i -lt $logLines.Count; $i++) {
        if ($logLines[$i] -match '^!') {
            $i
        }
    }

    if (-not $errorIndexes) {
        return
    }

    Write-Host ""
    Write-Host "LaTeX reported the following error(s):" -ForegroundColor Red

    foreach ($index in $errorIndexes) {
        $start = [Math]::Max(0, $index - 2)
        $end = [Math]::Min($logLines.Count - 1, $index + 4)
        for ($lineIndex = $start; $lineIndex -le $end; $lineIndex++) {
            Write-Host $logLines[$lineIndex]
        }
        Write-Host ""
    }
}

if (-not (Test-Path -LiteralPath $mainFile)) {
    throw "Could not find main.tex in $projectDir"
}

if ($Clean) {
    Write-Host "Cleaning LaTeX build artifacts in $projectDir..." -ForegroundColor Yellow
    Remove-BuildArtifacts -Path $projectDir
}

Push-Location $projectDir
try {
    if (Test-Tool -Name "latexmk") {
        Write-Host "Building blackbook with latexmk..." -ForegroundColor Cyan
        & latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
        $buildExitCode = $LASTEXITCODE
    }
    elseif (Test-Tool -Name "pdflatex") {
        Write-Host "latexmk not found. Falling back to pdflatex..." -ForegroundColor Yellow
        & pdflatex -interaction=nonstopmode -halt-on-error main.tex
        $buildExitCode = $LASTEXITCODE
        if ($buildExitCode -eq 0) {
            & pdflatex -interaction=nonstopmode -halt-on-error main.tex
            $buildExitCode = $LASTEXITCODE
        }
    }
    else {
        throw "No LaTeX compiler found. Install MiKTeX or TeX Live, then rerun this script."
    }
}
finally {
    Pop-Location
}

if (($buildExitCode -ne 0) -or (-not (Test-Path -LiteralPath $pdfFile))) {
    Show-LatexErrors -LogPath $logFile
    throw "Build failed. Check $logFile for full details."
}

Write-Host ""
Write-Host "PDF ready: $pdfFile" -ForegroundColor Green
Write-Host "Tip: run .\build.ps1 -Clean to remove old auxiliary files before rebuilding." -ForegroundColor DarkGray

if ($OpenPdf) {
    Start-Process -FilePath $pdfFile
}
