<#
.SYNOPSIS
    Refuses a paid Android bundle that would lock its owner or request another purchase.
    Accepts site.config.json or a final APK/AAB; no store connection is required.
#>
param(
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
        if ($entries.Count -ne 1) { throw "Paid Android access: expected exactly one $entryPath in $Path" }
        $reader = [IO.StreamReader]::new($entries[0].Open(), [Text.Encoding]::UTF8)
        try { $json = $reader.ReadToEnd() } finally { $reader.Dispose() }
    } finally { $archive.Dispose() }
} elseif ($extension -eq ".json") {
    $json = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
} else {
    throw "Paid Android access: expected a JSON config, APK or AAB: $Path"
}

$config = $json | ConvertFrom-Json
if ($null -eq $config -or
    $config.instrument -cne $Instrument -or
    $config.unlocked -isnot [bool] -or $config.unlocked -ne $true -or
    $config.nativeBilling -isnot [bool] -or $config.nativeBilling -ne $false -or
    $null -ne $config.PSObject.Properties["testKeyHash"]) {
    throw "Paid Android access: $Path must use instrument=$Instrument, unlocked=true, nativeBilling=false, with no testKeyHash. Refusing to distribute a locked app."
}
Write-Host "Paid Android access verified: $Instrument ($Path)" -ForegroundColor Green
