<#
.SYNOPSIS
    Builds a debug APK for one Fretboard Hero instrument variant (guitar, bass-4, ukulele).

.PARAMETER Instrument
    One of: guitar, bass-4, ukulele

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).

.PARAMETER BuildType
    "Debug" (default, unsigned, for local testing) or "Release" (signed, requires
    app/android/keystore.properties -- see docs/TECHNICAL.md).
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument,

    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Debug"
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

    # 3c. Update the Android app display name and custom URL scheme to match this instrument
    $stringsPath = Join-Path $appRoot "android\app\src\main\res\values\strings.xml"
    $stringsXml = [xml](Get-Content $stringsPath -Raw)
    foreach ($node in $stringsXml.resources.string) {
        switch ($node.name) {
            "app_name" { $node.InnerText = $entry.name }
            "title_activity_main" { $node.InnerText = $entry.name }
            "package_name" { $node.InnerText = $entry.appId }
            "custom_url_scheme" { $node.InnerText = $entry.appId }
        }
    }
    $stringsXml.Save($stringsPath)

    # 3b. Generate the Android launcher icon for this instrument from its web icon
    $iconKey = if ($entry.iconKey) { $entry.iconKey } else { $Instrument }
    $iconSource = Join-Path $RepoPath "web\assets\instruments\$iconKey\icon-1024.png"
    if (-not (Test-Path $iconSource)) {
        throw "Missing icon source for instrument '$Instrument' at $iconSource"
    }
    # @capacitor/assets joins projectRoot + assetPath with path.join, which breaks
    # if assetPath is absolute. Use a path relative to $appRoot (we're Push-Location'd there).
    $assetsTemp = Join-Path $appRoot "assets"
    if (Test-Path $assetsTemp) { Remove-Item $assetsTemp -Recurse -Force }
    New-Item -ItemType Directory -Path $assetsTemp -Force | Out-Null
    Copy-Item $iconSource (Join-Path $assetsTemp "logo.png")

    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    npx @capacitor/assets generate --android --iconBackgroundColor "#05070b" --iconBackgroundColorDark "#05070b" --assetPath "assets"
    $assetsExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousEap
    Remove-Item $assetsTemp -Recurse -Force -ErrorAction SilentlyContinue
    if ($assetsExitCode -ne 0) {
        throw "npx @capacitor/assets generate failed with exit code $assetsExitCode"
    }

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

    # 5. Build the APK (debug or signed release)
    $gradleTask = if ($BuildType -eq "Release") { "assembleRelease" } else { "assembleDebug" }
    Push-Location (Join-Path $appRoot "android")
    try {
        & .\gradlew.bat $gradleTask
        if ($LASTEXITCODE -ne 0) {
            throw "gradlew $gradleTask failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
        $ErrorActionPreference = $previousEap
    }

    # 6. Copy the output APK into dist/ with an instrument-specific name
    $buildTypeLower = $BuildType.ToLower()
    $builtApk = Join-Path $appRoot "android\app\build\outputs\apk\$buildTypeLower\app-$buildTypeLower.apk"
    if (-not (Test-Path $builtApk)) {
        throw "Build did not produce app-$buildTypeLower.apk at $builtApk"
    }
    $outputApk = Join-Path $distDir "fretboard-hero-$Instrument-$buildTypeLower.apk"
    Copy-Item -Path $builtApk -Destination $outputApk -Force
    Write-Host "Built $outputApk" -ForegroundColor Green
} finally {
    Pop-Location
}
