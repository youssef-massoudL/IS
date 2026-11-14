<#
Generates the ZIP archives referenced by the site:
  downloads/all.zip
  downloads/<subject-id>.zip

Entry names are ASCII and stable so archives stay readable on every OS.
Run after editing data/subjects.json:
  powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1
#>
[CmdletBinding()]
param(
  [switch]$Quiet,
  [switch]$IncludeAll
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$manifestPath = Join-Path (Join-Path $root "data") "subjects.json"
$filesRoot = Join-Path $root "files"
$outRoot = Join-Path $root "downloads"

if (-not (Test-Path -LiteralPath $manifestPath)) { throw "missing manifest: $manifestPath" }
if (-not (Test-Path -LiteralPath $filesRoot)) { throw "missing files folder: $filesRoot" }

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

if (Test-Path -LiteralPath $outRoot) { Remove-Item -LiteralPath $outRoot -Recurse -Force }
New-Item -ItemType Directory -Path $outRoot -Force | Out-Null

function New-Archive {
  param(
    [Parameter(Mandatory)][string]$ZipPath,
    [Parameter(Mandatory)][object[]]$Entries
  )

  $parent = Split-Path -Parent $ZipPath
  if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }

  $stream = [System.IO.File]::Open($ZipPath, [System.IO.FileMode]::CreateNew)
  $archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'

  try {
    foreach ($entry in $Entries) {
      $name = $entry.Name.Replace('\', '/')
      if (-not $seen.Add($name)) { continue }
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $archive, $entry.Source, $name, [System.IO.Compression.CompressionLevel]::Fastest)
    }
  }
  finally {
    $archive.Dispose()
    $stream.Dispose()
  }
}

$allEntries = New-Object System.Collections.Generic.List[object]
$perSubject = @{}

foreach ($subject in $manifest.subjects) {
  $entries = New-Object System.Collections.Generic.List[object]

  foreach ($section in $subject.sections) {
    foreach ($file in $section.files) {
      $source = Join-Path $root ($file.path -replace '/', [string][System.IO.Path]::DirectorySeparatorChar)
      if (-not (Test-Path -LiteralPath $source)) {
        Write-Warning "missing file: $($file.path)"
        continue
      }
      $rel = $file.path -replace '^files[\\/]', ''
      $item = [pscustomobject]@{ Source = $source; Name = $rel }
      $entries.Add($item) | Out-Null
      $allEntries.Add($item) | Out-Null
    }
  }

  $perSubject[$subject.id] = $entries
}

if ($IncludeAll) {
  $allZip = Join-Path $outRoot "all.zip"
  New-Archive -ZipPath $allZip -Entries $allEntries.ToArray()
}

foreach ($subject in $manifest.subjects) {
  $zipPath = Join-Path $outRoot ($subject.id + ".zip")
  New-Archive -ZipPath $zipPath -Entries $perSubject[$subject.id].ToArray()
}

if (-not $Quiet) {
  Get-ChildItem -LiteralPath $outRoot -Filter *.zip |
    Sort-Object Name |
    ForEach-Object { "{0,-28} {1,8:N1} MB" -f $_.Name, ($_.Length / 1MB) }
  $total = (Get-ChildItem -LiteralPath $outRoot -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
  "total {0:N1} MB" -f $total
}
