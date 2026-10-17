<#
.SYNOPSIS
    Validates the R8 mapping for a release package and the JavaScript billing API.
    An AAB must contain exactly the same mapping as the sidecar kept in dist.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$MappingPath
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Android mapping: package is missing: $Path"
}
if (-not (Test-Path -LiteralPath $MappingPath -PathType Leaf)) {
    throw "Android mapping: R8 mapping.txt is missing. Build Release with minifyEnabled true."
}
$mapping = [IO.File]::ReadAllText($MappingPath)
if ($mapping -notmatch '(?m)^# compiler: R8\r?$' -or $mapping -notmatch '(?m)^\S+ -> \S+:\r?$') {
    throw "Android mapping: expected a non-empty R8 mapping, not a placeholder."
}

# Capacitor resolves these entry points by their Java names at runtime. Check the
# actual shrinker's output, not only the keep rules in the source tree.
$billingClass = 'com.guitar.fretboardhero.PlayBillingPlugin'
$classPattern = '(?m)^' + [regex]::Escape($billingClass) + ' -> ' + [regex]::Escape($billingClass) + ':\r?$'
$classMatch = [regex]::Match($mapping, $classPattern)
if (-not $classMatch.Success) {
    throw "Android mapping: PlayBillingPlugin was removed or renamed by R8. Check Capacitor consumer rules."
}
$classBody = ($mapping.Substring($classMatch.Index + $classMatch.Length) -split '(?m)^\S+ -> \S+:\r?$', 2)[0]
foreach ($method in @('cachedState', 'price', 'purchase', 'restore')) {
    $methodPattern = '(?m)^\s+(?:\d+:\d+:)?void ' + $method + '\(com\.getcapacitor\.PluginCall\)(?::\d+(?::\d+)?)? -> ' + $method + '\r?$'
    if ($classBody -notmatch $methodPattern) {
        throw "Android mapping: PlayBilling.$method was removed or renamed by R8."
    }
}

$extension = [IO.Path]::GetExtension($Path).ToLowerInvariant()
if ($extension -notin @('.apk', '.aab')) {
    throw "Android mapping: expected an APK or AAB: $Path"
}
if ($extension -eq '.aab') {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $entryPath = 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map'
        $entries = @($archive.Entries | Where-Object { $_.FullName -ceq $entryPath })
        if ($entries.Count -ne 1) {
            throw "Android mapping: expected exactly one embedded proguard.map in the AAB."
        }
        $reader = [IO.StreamReader]::new($entries[0].Open(), [Text.Encoding]::UTF8)
        try { $embedded = $reader.ReadToEnd() } finally { $reader.Dispose() }
        if ($embedded -cne $mapping) {
            throw "Android mapping: the AAB and mapping.txt come from different builds."
        }
    } finally { $archive.Dispose() }
}
Write-Host "Android release mapping verified: $Path" -ForegroundColor Green
