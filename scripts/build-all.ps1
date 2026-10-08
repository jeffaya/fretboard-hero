<#
.SYNOPSIS
    Builds APK and/or AAB packages for all Fretboard Hero instrument variants (guitar, bass-4, ukulele).

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

$instruments = @("guitar", "bass-4", "ukulele")
foreach ($instrument in $instruments) {
    & (Join-Path $RepoPath "scripts\build-instrument.ps1") -Instrument $instrument -RepoPath $RepoPath -BuildType $BuildType -Format $Format -VersionCode $VersionCode -VersionName $VersionName
}

Write-Host "All instrument $Format packages built in $(Join-Path $RepoPath 'dist')." -ForegroundColor Green
