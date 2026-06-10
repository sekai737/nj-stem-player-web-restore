param(
    [Parameter(Mandatory = $true)]
    [string]$StemsDir
)

$ErrorActionPreference = "Stop"

$ArchiveUrl = "https://archive.org/download/newjeans-stem-player-stems/stems.zip"
$UserAgent = "NJStemLibraryInstaller/1.0"

function Test-StemsPresent([string]$Dir) {
    if (-not (Test-Path $Dir)) { return $false }
    return [bool](Get-ChildItem -Path $Dir -Recurse -File -Include *.mp3, *.flac, *.wav -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Expand-StemsZip([string]$ZipPath, [string]$DestDir) {
    $parent = Split-Path $DestDir -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    if (Test-Path $DestDir) {
        Remove-Item -Path $DestDir -Recurse -Force
    }

    $tempExtract = Join-Path $env:TEMP "nj-stems-extract-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempExtract -Force | Out-Null

    try {
        Expand-Archive -LiteralPath $ZipPath -DestinationPath $tempExtract -Force

        $nested = Join-Path $tempExtract "stems"
        if (Test-Path $nested) {
            Move-Item -LiteralPath $nested -Destination $DestDir
        } else {
            New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
            Get-ChildItem -LiteralPath $tempExtract | Move-Item -Destination $DestDir
        }
    } finally {
        if (Test-Path $tempExtract) {
            Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

if (Test-StemsPresent $StemsDir) {
    Write-Host "Stem library already present at $StemsDir"
    exit 0
}

$zipPath = Join-Path $env:TEMP "nj-stems-stems.zip"
if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Write-Host "Downloading stem pack from Archive.org..."
$request = [System.Net.HttpWebRequest]::Create($ArchiveUrl)
$request.UserAgent = $UserAgent
$request.Method = "GET"
$request.AllowAutoRedirect = $true
$response = $request.GetResponse()
$total = $response.ContentLength
$stream = $response.GetResponseStream()
$fileStream = [System.IO.File]::Create($zipPath)

try {
    $buffer = New-Object byte[] 65536
    $read = 0
    $done = 0L
    while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
        $fileStream.Write($buffer, 0, $read)
        $done += $read
        if ($total -gt 0) {
            $pct = [math]::Floor(($done * 100) / $total)
            Write-Progress -Activity "Downloading stems" -Status "$pct% complete" -PercentComplete $pct
        }
    }
} finally {
    $fileStream.Close()
    $stream.Close()
    $response.Close()
    Write-Progress -Activity "Downloading stems" -Completed
}

Write-Host "Extracting stem files..."
Expand-StemsZip -ZipPath $zipPath -DestDir $StemsDir

if (-not (Test-StemsPresent $StemsDir)) {
    Write-Error "Install finished but no stem audio files were found."
}

Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
Write-Host "Stem library installed to $StemsDir"
exit 0
