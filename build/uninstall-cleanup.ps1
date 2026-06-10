param(
    [string]$InstallDir = "",
    [string]$PathsFile = ""
)

$ErrorActionPreference = "Continue"

if (-not $PathsFile) {
    $PathsFile = Join-Path $PSScriptRoot "windows-paths.json"
}

if (-not (Test-Path $PathsFile)) {
    Write-Error "Missing paths file: $PathsFile"
    exit 1
}

$paths = Get-Content $PathsFile -Raw | ConvertFrom-Json

function Remove-IfExists([string]$Target, [string]$Category) {
    if (-not $Target) { return }
    if (Test-IsDevelopmentPath $Target) {
        Write-Host "[$Category] Skipping development path: $Target"
        return
    }
    if (Test-Path -LiteralPath $Target) {
        Write-Host "[$Category] Removing $Target"
        Remove-Item -LiteralPath $Target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Remove-FileIfExists([string]$Target, [string]$Category) {
    if (-not $Target) { return }
    if (Test-IsDevelopmentPath $Target) {
        Write-Host "[$Category] Skipping development path: $Target"
        return
    }
    if (Test-Path -LiteralPath $Target) {
        Write-Host "[$Category] Removing $Target"
        Remove-Item -LiteralPath $Target -Force -ErrorAction SilentlyContinue
    }
}

function Remove-EmptyParent([string]$Dir, [string]$Category) {
    if (-not $Dir) { return }
    if (Test-IsDevelopmentPath $Dir) { return }
    if (-not (Test-Path -LiteralPath $Dir)) { return }
    $items = Get-ChildItem -LiteralPath $Dir -Force -ErrorAction SilentlyContinue
    if ($items -and $items.Count -gt 0) { return }
    Write-Host "[$Category] Removing empty folder $Dir"
    Remove-Item -LiteralPath $Dir -Force -ErrorAction SilentlyContinue
}

function Test-IsDevelopmentPath([string]$Target) {
    if (-not $Target) { return $false }

    $normalized = [System.IO.Path]::GetFullPath($Target).TrimEnd('\')

    $devUserData = Join-Path $env:APPDATA $paths.devUserDataFolderName
    if ($normalized -eq [System.IO.Path]::GetFullPath($devUserData).TrimEnd('\')) { return $true }

    $devLocalUserData = Join-Path $env:LOCALAPPDATA $paths.devUserDataFolderName
    if ($normalized -eq [System.IO.Path]::GetFullPath($devLocalUserData).TrimEnd('\')) { return $true }

    $current = $normalized
    for ($i = 0; $i -lt 12; $i++) {
        if (-not $current -or -not (Test-Path -LiteralPath $current)) { break }

        if (Test-Path -LiteralPath (Join-Path $current ".git")) { return $true }
        if (Test-Path -LiteralPath (Join-Path $current "node_modules")) { return $true }
        if (Test-Path -LiteralPath (Join-Path $current ".electron-library-path")) { return $true }
        if (Test-Path -LiteralPath (Join-Path $current "vite.config.ts")) { return $true }
        if (Test-Path -LiteralPath (Join-Path $current "tsconfig.electron.json")) { return $true }
        if (Test-Path -LiteralPath (Join-Path $current "public\stems")) { return $true }

        $parent = Split-Path $current -Parent
        if (-not $parent -or $parent -eq $current) { break }
        $current = $parent
    }

    return $false
}

function Test-AppOwnedStemPath([string]$StemPath) {
    if (-not $StemPath) { return $false }
    if (Test-IsDevelopmentPath $StemPath) { return $false }

    $normalized = [System.IO.Path]::GetFullPath($StemPath).TrimEnd('\')
    $defaultStems = [System.IO.Path]::GetFullPath($paths.defaultStemsDir).TrimEnd('\')
    $defaultParent = [System.IO.Path]::GetFullPath($paths.defaultProgramFilesParent).TrimEnd('\')

    if ($normalized -eq $defaultStems) { return $true }
    if ($normalized.StartsWith("$defaultParent\", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

    if ($InstallDir -and -not (Test-IsDevelopmentPath $InstallDir)) {
        $installRoot = [System.IO.Path]::GetFullPath($InstallDir).TrimEnd('\')
        if ($normalized.StartsWith("$installRoot\", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    }

    return $false
}

function Remove-RegistryKeyIfExists([Microsoft.Win32.RegistryHive]$Hive, [string]$SubKey, [string]$Category) {
    $view = [Microsoft.Win32.RegistryView]::Registry64
    $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey($Hive, $view)
    if ($null -eq $base) { return }
    try {
        if ($null -ne $base.OpenSubKey($SubKey)) {
            Write-Host "[$Category] Removing registry $Hive\$SubKey"
            $base.DeleteSubKeyTree($SubKey, $false)
        }
    } catch {
        Write-Host "[$Category] Could not remove registry $Hive\$SubKey : $_"
    } finally {
        $base.Close()
    }
}

# --- Stems installed by setup (app-owned locations only; never dev project folders) ---
$stemsInstalled = $false
$stemsDir = $null
try {
    $reg = Get-ItemProperty -Path "HKLM:\$($paths.registryKey)" -ErrorAction SilentlyContinue
    if ($reg -and $reg.StemsInstalledBySetup -eq 1) {
        $stemsInstalled = $true
        $stemsDir = $reg.StemsDir
    }
} catch { }

if ($stemsInstalled -and $stemsDir -and (Test-AppOwnedStemPath $stemsDir)) {
    Remove-IfExists -Target $stemsDir -Category "Installation files"
    $parent = Split-Path $stemsDir -Parent
    if ($parent -and (Test-AppOwnedStemPath $parent)) {
        Remove-EmptyParent -Dir $parent -Category "Installation files"
    }
} elseif ($stemsInstalled -and $stemsDir) {
    Write-Host "[Installation files] Skipping stem library outside app-owned paths: $stemsDir"
}

# --- User data (packaged app profile only; dev profile is never touched) ---
$packagedUserData = Join-Path $env:APPDATA $paths.packagedUserDataFolderName
Remove-IfExists -Target $packagedUserData -Category "User data"

$packagedLocalUserData = Join-Path $env:LOCALAPPDATA $paths.packagedUserDataFolderName
Remove-IfExists -Target $packagedLocalUserData -Category "User data"

Write-Host "[User data] Preserving Electron dev profile: $(Join-Path $env:APPDATA $paths.devUserDataFolderName)"

# --- Settings/configuration (packaged profile only) ---
$configFile = Join-Path $packagedUserData "library-config.json"
Remove-FileIfExists -Target $configFile -Category "Settings/configuration"

# --- Cache/temp files (setup artifacts only) ---
$tempZip = Join-Path $env:TEMP $paths.tempZipFileName
Remove-FileIfExists -Target $tempZip -Category "Cache/temp files"

Get-ChildItem -Path $env:TEMP -Filter "$($paths.tempExtractPrefix)*" -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-IfExists -Target $_.FullName -Category "Cache/temp files" }

# --- Logs (packaged profile only) ---
$logsDir = Join-Path $packagedUserData "logs"
Remove-IfExists -Target $logsDir -Category "Logs"

# --- Shortcuts ---
$programs = [Environment]::GetFolderPath("Programs")
$startMenuDir = Join-Path $programs $paths.startMenuFolderName
Remove-FileIfExists -Target (Join-Path $startMenuDir $paths.legacyStemInstallerShortcutName) -Category "Shortcuts"
Remove-FileIfExists -Target (Join-Path $startMenuDir "$($paths.productName).lnk") -Category "Shortcuts"
Remove-EmptyParent -Dir $startMenuDir -Category "Shortcuts"

$desktop = [Environment]::GetFolderPath("Desktop")
Remove-FileIfExists -Target (Join-Path $desktop $paths.desktopShortcutName) -Category "Shortcuts"

$commonDesktop = Join-Path $env:PUBLIC "Desktop"
Remove-FileIfExists -Target (Join-Path $commonDesktop $paths.desktopShortcutName) -Category "Shortcuts"

# --- Legacy bundled stem installer (pre-unified NSIS; skip if install dir is a dev repo) ---
if ($InstallDir -and -not (Test-IsDevelopmentPath $InstallDir)) {
    Remove-IfExists -Target (Join-Path $InstallDir "StemLibraryInstaller") -Category "Other app-generated files"
}

$legacyStemUninstaller = Join-Path $paths.defaultProgramFilesParent $paths.legacyStemUninstallerName
Remove-FileIfExists -Target $legacyStemUninstaller -Category "Other app-generated files"

# --- Update files ---
$updaterDir = Join-Path $env:LOCALAPPDATA $paths.updaterFolderName
Remove-IfExists -Target $updaterDir -Category "Update files"

# --- Registry entries (installer only; no dev tooling keys) ---
Remove-RegistryKeyIfExists -Hive ([Microsoft.Win32.RegistryHive]::LocalMachine) -SubKey $paths.registryKey -Category "Registry entries"
Remove-RegistryKeyIfExists -Hive ([Microsoft.Win32.RegistryHive]::LocalMachine) -SubKey $paths.legacyStemLibraryUninstallKey -Category "Registry entries"

$uninstallKey = "Software\Microsoft\Windows\CurrentVersion\Uninstall\$($paths.uninstallRegistryGuid)"
Remove-RegistryKeyIfExists -Hive ([Microsoft.Win32.RegistryHive]::CurrentUser) -SubKey $uninstallKey -Category "Registry entries"

Write-Host "Uninstall cleanup complete."
exit 0
