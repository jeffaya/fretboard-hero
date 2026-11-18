<#
.SYNOPSIS
    Builds Guitar, Bass and Ukulele Android App Bundles sequentially.

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).

.PARAMETER Profile
    Store (default): demo + native purchases. Preview: fully unlocked, separate identity.

.PARAMETER BuildType
    "Debug" (default, debug-signed, for local testing) or "Release" (signed, requires
    app/android/keystore.properties -- see docs/TECHNICAL.md).

.PARAMETER VersionCode
    Android integer version code. Increase for each Google Play upload.

.PARAMETER VersionName
    Public version name, such as 1.1.0.
#>
param(
    [ValidateSet("Store", "Preview")]
    [string]$Profile = "Store",

    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Debug",

    [ValidateRange(1, 2100000000)]
    [int]$VersionCode = 1,

    [ValidatePattern('^[0-9]+\.[0-9]+(\.[0-9]+)?([.-][A-Za-z0-9]+)*$')]
    [string]$VersionName = "1.0"
)

$ErrorActionPreference = "Stop"

# Capacitor and Gradle reuse one native tree; never build these concurrently.
$instruments = Get-Content (Join-Path $RepoPath "app/instruments.json") -Raw | ConvertFrom-Json
foreach ($instrument in $instruments.PSObject.Properties.Name) {
    & (Join-Path $RepoPath "scripts/build-instrument.ps1") -Instrument $instrument -RepoPath $RepoPath -Profile $Profile -BuildType $BuildType -VersionCode $VersionCode -VersionName $VersionName
}
Write-Host "All $Profile bundles built in $(Join-Path $RepoPath 'dist')." -ForegroundColor Green
