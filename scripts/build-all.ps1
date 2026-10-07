<#
.SYNOPSIS
    Builds debug APKs for all Fretboard Hero instrument variants (guitar, bass-4, ukulele).

.PARAMETER RepoPath
    Root of the fretoboard-hero repo. Default: the repo root (two levels up from this script).

.PARAMETER BuildType
    "Debug" (default, unsigned, for local testing) or "Release" (signed, requires
    app/android/keystore.properties -- see docs/TECHNICAL.md).
#>
param(
    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Debug"
)

$ErrorActionPreference = "Stop"

$instruments = @("guitar", "bass-4", "ukulele")
foreach ($instrument in $instruments) {
    & (Join-Path $RepoPath "scripts\build-instrument.ps1") -Instrument $instrument -RepoPath $RepoPath -BuildType $BuildType
}

Write-Host "All instrument APKs built in $(Join-Path $RepoPath 'dist')." -ForegroundColor Green
