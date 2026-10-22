<#
.SYNOPSIS
    Builds one instrument's application, including all three playable instruments.

.PARAMETER Instrument
    One of: guitar, bass-4, ukulele

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).

.PARAMETER Profile
    Store (default): demo + native purchases. Preview: fully unlocked, separate identity.

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
    [ValidateSet("Store", "Preview")]
    [string]$Profile = "Store",

    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument = "guitar",

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
$profileLower = $Profile.ToLower()
$extensions = if ($Format -eq "Both") { @("apk", "aab") } else { @($Format.ToLower()) }
$mappingOutput = Join-Path $distDir "fretboard-hero-$Instrument-$profileLower-$buildTypeLower-mapping.txt"
Remove-Item $mappingOutput -Force -ErrorAction SilentlyContinue
# Do not leave a stale package that could be mistaken for this build's output.
foreach ($extension in $extensions) {
    Remove-Item (Join-Path $distDir "fretboard-hero-$Instrument-$profileLower-$buildTypeLower.$extension") -Force -ErrorAction SilentlyContinue
}
$instrumentsPath = Join-Path $appRoot "instruments.json"
$instruments = Get-Content $instrumentsPath -Raw | ConvertFrom-Json
if (-not $instruments.$Instrument) { throw "Unknown instrument '$Instrument'." }
$entry = $instruments.$Instrument
if ($Profile -eq "Preview") {
    $entry.appId += ".preview"
    $entry.name += " Preview"
}

# Fail before generating a package whose WebView would immediately reject audio.
& (Join-Path $PSScriptRoot "validate-android-microphone.ps1") -Path (Join-Path $appRoot "android/app/src/main/AndroidManifest.xml")

# Validate the source before touching native resources. The asset generator can
# print a decoding error and still exit 0, leaving empty launcher PNGs behind.
$iconKey = if ($entry.iconKey) { $entry.iconKey } else { $Instrument }
$iconSource = Join-Path $RepoPath "web/assets/instruments/$iconKey/icon-1024.png"
$imageValidator = Join-Path $PSScriptRoot "validate-android-images.cjs"
& node $imageValidator $iconSource
if ($LASTEXITCODE -ne 0) {
    throw "Android icon validation failed for '$Instrument'. See the error above."
}

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

# 1. Sync the web engine for this instrument
& (Join-Path $RepoPath "scripts\sync-web.ps1") -Instrument $Instrument -RepoPath $RepoPath -Platform Android -Profile $Profile

# 2. Write capacitor.config.json for this instrument
$capacitorConfig = @{
    appId   = $entry.appId
    appName = $entry.name
    webDir  = "www"
    # StatusBar is retained for iOS only. Android uses Capacitor's core SystemBars
    # for icon appearance and MainActivity for insets, without legacy color APIs.
    android = @{
        includePlugins = @("@capacitor/app", "@capacitor/splash-screen")
    }
    plugins = @{
        SystemBars = @{
            style          = "DARK"
            insetsHandling = "disable"
        }
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
    # 3. Update the Android applicationId to match the distribution profile
    $gradlePath = Join-Path $appRoot "android\app\build.gradle"
    $gradleContent = Get-Content $gradlePath -Raw
    $gradleContent = $gradleContent -replace 'applicationId "[^"]*"', "applicationId `"$($entry.appId)`""
    # Write without a BOM: Gradle's Groovy parser rejects a leading UTF-8 BOM.
    [System.IO.File]::WriteAllText($gradlePath, $gradleContent, (New-Object System.Text.UTF8Encoding $false))

    # 3c. Update the Android app display name and custom URL scheme to match the distribution profile
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

    # 3b. Generate this application's launcher icon from instruments.json
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

    & node $imageValidator (Join-Path $appRoot "android/app/src/main/res")
    if ($LASTEXITCODE -ne 0) {
        throw "Android resource validation failed. Refusing to package invalid images."
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
        & .\gradlew.bat --no-scan @gradleTasks "-PappVersionCode=$VersionCode" "-PappVersionName=$VersionName"
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
        $ErrorActionPreference = $previousEap
    }

    # 6. Validate every requested package before publishing any of them to dist.
    # AGP embeds this same R8 mapping in an AAB; APK-only builds need the sidecar.
    $mappingPath = Join-Path $appRoot "android/app/build/outputs/mapping/release/mapping.txt"
    foreach ($extension in $extensions) {
        $outputKind = if ($extension -eq "apk") { "apk" } else { "bundle" }
        $built = Join-Path $appRoot "android/app/build/outputs/$outputKind/$buildTypeLower/app-$buildTypeLower.$extension"
        if (-not (Test-Path $built)) {
            throw "Build did not produce the expected $extension at $built"
        }
        # Inspect the actual archive, not only the source config: stale native
        # assets must never mix Store and Preview access.
        & (Join-Path $PSScriptRoot "validate-android-access.ps1") -Path $built -Instrument $Instrument -Profile $Profile -RepoPath $RepoPath
        if ($BuildType -eq "Release") {
            & (Join-Path $PSScriptRoot "validate-android-mapping.ps1") -Path $built -MappingPath $mappingPath
        }
    }
    if ($BuildType -eq "Release") {
        Copy-Item -Path $mappingPath -Destination $mappingOutput -Force
    }
    foreach ($extension in $extensions) {
        $outputKind = if ($extension -eq "apk") { "apk" } else { "bundle" }
        $built = Join-Path $appRoot "android/app/build/outputs/$outputKind/$buildTypeLower/app-$buildTypeLower.$extension"
        $output = Join-Path $distDir "fretboard-hero-$Instrument-$profileLower-$buildTypeLower.$extension"
        Copy-Item -Path $built -Destination $output -Force
        Write-Host "Built $output (version $VersionName, code $VersionCode)" -ForegroundColor Green
    }
} finally {
    Pop-Location
}
