<#
.SYNOPSIS
    Regenerates app/www from web/ for one instrument, and wires in the native
    back-button bridge. app/www is always disposable: never hand-edit it.

.PARAMETER Instrument
    One of: guitar, bass-4, ukulele

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument,

    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

    [ValidateSet("Android", "iOS")]
    [string]$Platform = "Android"
)

$ErrorActionPreference = "Stop"

$webSource = Join-Path $RepoPath "web"
$appRoot   = Join-Path $RepoPath "app"
$wwwPath   = Join-Path $appRoot "www"

if (-not (Test-Path $webSource)) {
    throw "Web source folder not found: $webSource"
}

# 1. Fresh copy of the web engine into app/www (disposable, always regenerated)
if (Test-Path $wwwPath) {
    Remove-Item $wwwPath -Recurse -Force
}
New-Item -ItemType Directory -Path $wwwPath -Force | Out-Null
Copy-Item -Path (Join-Path $webSource "*") -Destination $wwwPath -Recurse -Force

# 2. Force the instrument selection for this build
$siteConfigPath = Join-Path $wwwPath "site.config.json"
$siteConfig = Get-Content $siteConfigPath -Raw | ConvertFrom-Json
$siteConfig.instrument = $Instrument
# Both native platforms use their store entitlement; no native bundle is pre-unlocked.
$siteConfig | Add-Member -NotePropertyName unlocked -NotePropertyValue $false -Force
$siteConfig | Add-Member -NotePropertyName nativeBilling -NotePropertyValue $true -Force
$siteConfig.PSObject.Properties.Remove("testKeyHash")
$utf8Config = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($siteConfigPath, ($siteConfig | ConvertTo-Json -Depth 8), $utf8Config)


# Keep the universal iOS App Store icon and Capacitor source aligned with this build.
$iconKey = if ($Instrument -eq "bass-4") { "bass" } else { $Instrument }
$iconSource = Join-Path $webSource "assets\instruments\$iconKey\icon-1024.png"
Copy-Item $iconSource (Join-Path $appRoot "resources\icon.png") -Force
Copy-Item $iconSource (Join-Path $appRoot "ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png") -Force

# 3. Copy the native bridge script and inject its <script> tag before </body>
$bridgeSource = Join-Path $appRoot "native-assets\capacitor-bridge.js"
$wwwCoreDir = Join-Path $wwwPath "core"
if (-not (Test-Path $wwwCoreDir)) {
    New-Item -ItemType Directory -Path $wwwCoreDir -Force | Out-Null
}
Copy-Item -Path $bridgeSource -Destination (Join-Path $wwwCoreDir "capacitor-bridge.js") -Force

$indexPath = Join-Path $wwwPath "index.html"
# Read/write as explicit UTF-8 (no BOM): Windows PowerShell's Get-Content/Set-Content
# default to the system ANSI codepage for BOM-less files, which corrupts multi-byte
# UTF-8 characters (emoji, arrows) in the source HTML.
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$indexContent = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
$bridgeTag = "  <script src=`"./core/capacitor-bridge.js`" defer></script>`r`n"
$indexContent = $indexContent -replace '(?=</body>)', $bridgeTag
[System.IO.File]::WriteAllText($indexPath, $indexContent, $utf8NoBom)

Write-Host "app/www synced for instrument '$Instrument'." -ForegroundColor Green
