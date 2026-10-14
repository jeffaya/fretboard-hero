<#
.SYNOPSIS
    Checks the manifest permissions required by Capacitor's WebView microphone.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = "Stop"
$android = "http://schemas.android.com/apk/res/android"
$tools = "http://schemas.android.com/tools"
[xml]$manifest = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
foreach ($name in @("android.permission.RECORD_AUDIO", "android.permission.MODIFY_AUDIO_SETTINGS")) {
    $permissions = @($manifest.SelectNodes('/manifest/uses-permission') | Where-Object {
        $_.GetAttribute('name', $android) -ceq $name -and
        -not $_.HasAttribute('maxSdkVersion', $android) -and
        $_.GetAttribute('node', $tools) -notin @('remove', 'removeAll')
    })
    if ($permissions.Count -ne 1) {
        throw "Android microphone requires one unrestricted $name declaration in $Path. Capacitor rejects audio capture if either audio permission is missing."
    }
}
Write-Host "Android microphone permissions verified: $Path" -ForegroundColor Green
