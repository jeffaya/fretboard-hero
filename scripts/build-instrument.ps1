<#
.SYNOPSIS
    Builds a debug APK for one Fretboard Hero instrument variant (guitar, bass-4, ukulele).

.PARAMETER Instrument
    One of: guitar, bass-4, ukulele

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument,

    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$appRoot = Join-Path $RepoPath "app"
$distDir = Join-Path $RepoPath "dist"
$instrumentsPath = Join-Path $appRoot "instruments.json"
$instruments = Get-Content $instrumentsPath -Raw | ConvertFrom-Json
$entry = $instruments.$Instrument
if (-not $entry) {
    throw "Unknown instrument '$Instrument'. Check instruments.json."
}

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

# 1. Sync the web engine for this instrument
& (Join-Path $RepoPath "scripts\sync-web.ps1") -Instrument $Instrument -RepoPath $RepoPath

# 2. Write capacitor.config.json for this instrument
$capacitorConfig = @{
    appId   = $entry.appId
    appName = $entry.name
    webDir  = "www"
    plugins = @{
        SplashScreen = @{
            backgroundColor    = "#05070b"
            launchAutoHide     = $true
            launchShowDuration = 400
        }
        StatusBar = @{
            style           = "DARK"
            backgroundColor = "#05070b"
        }
    }
} | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $appRoot "capacitor.config.json") -Value $capacitorConfig -Encoding UTF8

Push-Location $appRoot
try {
    # 3. Update the Android applicationId to match this instrument
    $gradlePath = Join-Path $appRoot "android\app\build.gradle"
    $gradleContent = Get-Content $gradlePath -Raw
    $gradleContent = $gradleContent -replace 'applicationId "[^"]*"', "applicationId `"$($entry.appId)`""
    # Write without a BOM: Gradle's Groovy parser rejects a leading UTF-8 BOM.
    [System.IO.File]::WriteAllText($gradlePath, $gradleContent, (New-Object System.Text.UTF8Encoding $false))

    # 4. Sync web assets + config into the native Android project
    # Native tools (npx/gradlew) write harmless notices to stderr; don't let
    # $ErrorActionPreference = "Stop" treat that as a terminating error.
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        $ErrorActionPreference = $previousEap
        throw "npx cap sync android failed with exit code $LASTEXITCODE"
    }

    # 5. Build the debug APK
    Push-Location (Join-Path $appRoot "android")
    try {
        & .\gradlew.bat assembleDebug
        if ($LASTEXITCODE -ne 0) {
            throw "gradlew assembleDebug failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
        $ErrorActionPreference = $previousEap
    }

    # 6. Copy the output APK into dist/ with an instrument-specific name
    $builtApk = Join-Path $appRoot "android\app\build\outputs\apk\debug\app-debug.apk"
    if (-not (Test-Path $builtApk)) {
        throw "Build did not produce app-debug.apk at $builtApk"
    }
    $outputApk = Join-Path $distDir "fretboard-hero-$Instrument-debug.apk"
    Copy-Item -Path $builtApk -Destination $outputApk -Force
    Write-Host "Built $outputApk" -ForegroundColor Green
} finally {
    Pop-Location
}
