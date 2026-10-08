<# Prepares one iPhone/iPad variant for Xcode. Requires npm dependencies in app/. #>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("guitar", "bass-4", "ukulele")]
    [string]$Instrument,
    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)
$ErrorActionPreference = "Stop"
$appRoot = Join-Path $RepoPath "app"
$entry = (Get-Content (Join-Path $appRoot "instruments.json") -Raw | ConvertFrom-Json).$Instrument
& (Join-Path $PSScriptRoot "sync-web.ps1") -Instrument $Instrument -RepoPath $RepoPath -Platform iOS
$utf8 = New-Object System.Text.UTF8Encoding $false
$configPath = Join-Path $appRoot "capacitor.config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$config.appId = $entry.appId
$config.appName = $entry.name
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 8), $utf8)
$projectPath = Join-Path $appRoot "ios/App/App.xcodeproj/project.pbxproj"
$project = [System.IO.File]::ReadAllText($projectPath)
$project = $project -replace 'PRODUCT_BUNDLE_IDENTIFIER = [^;]+;', "PRODUCT_BUNDLE_IDENTIFIER = $($entry.appId);"
[System.IO.File]::WriteAllText($projectPath, $project, $utf8)
$plistPath = Join-Path $appRoot "ios/App/App/Info.plist"
$plist = [System.IO.File]::ReadAllText($plistPath)
$plist = $plist -replace '(<key>CFBundleDisplayName</key>\s*<string>)[^<]*(</string>)', "`${1}$($entry.name)`${2}"
[System.IO.File]::WriteAllText($plistPath, $plist, $utf8)
Push-Location $appRoot
try {
    & npx cap sync ios
    if ($LASTEXITCODE -ne 0) { throw "Capacitor iOS sync failed." }
} finally { Pop-Location }
Write-Host "iOS prepared for $($entry.name). Open app/ios/App/App.xcodeproj on macOS to build and archive." -ForegroundColor Green
