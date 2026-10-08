<#
.SYNOPSIS
    Builds APK and/or AAB packages for one Fretboard Hero instrument variant (guitar, bass-4, ukulele).

.PARAMETER Instrument
    One of: guitar, bass-4, ukulele

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).

.PARAMETER BuildType
    "Debug" (default, debug-signed, for local testing) or "Release" (signed, requires
    app/android/keystore.properties -- see docs/TECHNICAL.md).
.PARAMETER Format
    Apk (default, preserves existing builds), Aab, or Both.

.PARAMETER VersionCode
    Android integer version code. Increase for each Google Play upload.

.PARAMETER VersionName
    Public version name, such as 1.1.0.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument,

    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Debug",

    [ValidateSet("Apk", "Aab", "Both")]
    [string]$Format = "Apk",

    [ValidateRange(1, 2100000000)]
    [int]$VersionCode = 1,

    [ValidatePattern('^[0-9]+\.[0-9]+(\.[0-9]+)?([.-][A-Za-z0-9]+)*$')]
    [string]$VersionName = "1.0"
)

$ErrorActionPreference = "Stop"

$appRoot = Join-Path $RepoPath "app"
$distDir = Join-Path $RepoPath "dist"
if ($BuildType -eq "Release" -and -not (Test-Path (Join-Path $appRoot "android/keystore.properties"))) {
    throw "Release signing requires app/android/keystore.properties. See docs/TECHNICAL.md."
}
$BuildType = if ($BuildType -eq "Release") { "Release" } else { "Debug" }
$buildTypeLower = $BuildType.ToLower()
$extensions = if ($Format -eq "Both") { @("apk", "aab") } else { @($Format.ToLower()) }
# Do not leave a stale package that could be mistaken for this build's output.
foreach ($extension in $extensions) {
    Remove-Item (Join-Path $distDir "fretboard-hero-$Instrument-$buildTypeLower.$extension") -Force -ErrorAction SilentlyContinue
}
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
& (Join-Path $RepoPath "scripts\sync-web.ps1") -Instrument $Instrument -RepoPath $RepoPath -Platform Android

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

    # 5. Build both requested formats in the same Gradle invocation.
    $gradleTasks = @()
    if ($extensions -contains "apk") { $gradleTasks += "assemble$BuildType" }
    if ($extensions -contains "aab") { $gradleTasks += "bundle$BuildType" }
    Push-Location (Join-Path $appRoot "android")
    try {
        & .\gradlew.bat @gradleTasks "-PappVersionCode=$VersionCode" "-PappVersionName=$VersionName"
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
        $ErrorActionPreference = $previousEap
    }

    # 6. Copy packages with stable instrument-specific names.
    foreach ($extension in $extensions) {
        $outputKind = if ($extension -eq "apk") { "apk" } else { "bundle" }
        $built = Join-Path $appRoot "android/app/build/outputs/$outputKind/$buildTypeLower/app-$buildTypeLower.$extension"
        if (-not (Test-Path $built)) {
            throw "Build did not produce the expected $extension at $built"
        }
        $output = Join-Path $distDir "fretboard-hero-$Instrument-$buildTypeLower.$extension"
        Copy-Item -Path $built -Destination $output -Force
        Write-Host "Built $output (version $VersionName, code $VersionCode)" -ForegroundColor Green
    }
} finally {
    Pop-Location
}
