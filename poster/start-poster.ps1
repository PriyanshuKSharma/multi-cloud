$ErrorActionPreference = 'Stop'

$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting poster site at http://localhost:$port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor DarkGray

Push-Location $root
try {
    python -m http.server $port
}
finally {
    Pop-Location
}
