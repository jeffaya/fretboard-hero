<#
.SYNOPSIS
    Checks that the packaged access policy matches the intended Store or Preview profile.
    Accepts site.config.json or a final APK/AAB; no store connection is required.
#>
param(
    [ValidateSet("Store", "Preview")]
    [string]$Profile = "Store",

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument
)

$ErrorActionPreference = "Stop"
$extension = [IO.Path]::GetExtension($Path).ToLowerInvariant()
if ($extension -in @(".apk", ".aab")) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $entryPath = if ($extension -eq ".aab") { "base/assets/public/site.config.json" } else { "assets/public/site.config.json" }
        $entries = @($archive.Entries | Where-Object { $_.FullName -eq $entryPath })
        if ($entries.Count -ne 1) { throw "Android access: expected exactly one $entryPath in $Path" }
        $reader = [IO.StreamReader]::new($entries[0].Open(), [Text.Encoding]::UTF8)
        try { $json = $reader.ReadToEnd() } finally { $reader.Dispose() }
    } finally { $archive.Dispose() }
} elseif ($extension -eq ".json") {
    $json = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
} else {
    throw "Android access: expected a JSON config, APK or AAB: $Path"
}

$config = $json | ConvertFrom-Json
$preview = $Profile -eq "Preview"
if ($null -eq $config -or
    $config.instrument -cne $Instrument -or
    $config.accessProfile -cne $Profile -or
    $config.unlocked -isnot [bool] -or $config.unlocked -ne $preview -or
    $config.nativeBilling -isnot [bool] -or $config.nativeBilling -ne (-not $preview) -or
    $null -ne $config.PSObject.Properties["testKeyHash"]) {
    throw "Android access: $Path does not match $Profile for $Instrument. Refusing to distribute the wrong access profile (or a web test key)."
}
Write-Host "Android access verified: $Profile, $Instrument ($Path)" -ForegroundColor Green
