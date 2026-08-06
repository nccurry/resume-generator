$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$toolsRoot = Join-Path $repoRoot ".tools"
$versionsFile = Join-Path $repoRoot "versions.env"

# Reads the pinned mise version and platform checksums from versions.env.
# Bootstrap startup uses these values to select and verify the exact mise archive.
function Read-VersionsFile {
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $versionsFile) {
    if ($line -match "^([A-Z0-9_]+)=(.+)$") {
      $values[$Matches[1]] = $Matches[2]
    }
  }
  return $values
}

# Runs a native tool and turns a nonzero exit code into a terminating error.
# The bootstrap flow uses this for mise installation commands and the requested Task target.
function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory)] [string] $Command,
    [Parameter(Mandatory)] [string[]] $CommandArguments
  )

  & $Command @CommandArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command $($CommandArguments -join ' ')"
  }
}

$versions = Read-VersionsFile
$miseVersion = $versions["MISE_VERSION"]
$architecture = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()) {
  "X64" { "x64" }
  "Arm64" { "arm64" }
  default { throw "Unsupported Windows architecture: $_" }
}

$checksumKey = "MISE_SHA256_WINDOWS_$($architecture.ToUpperInvariant())"
$expectedChecksum = $versions[$checksumKey]
if (-not $miseVersion -or -not $expectedChecksum) {
  throw "versions.env does not define MISE_VERSION and $checksumKey"
}

$miseDirectory = Join-Path $toolsRoot "mise\v$miseVersion\windows-$architecture"
$misePath = Join-Path $miseDirectory "mise.exe"
$miseShimPath = Join-Path $miseDirectory "mise-shim.exe"

if (-not (Test-Path -LiteralPath $misePath)) {
  $temporaryDirectory = Join-Path $toolsRoot ".tmp-$([Guid]::NewGuid().ToString('N'))"
  $archivePath = Join-Path $temporaryDirectory "mise.zip"
  New-Item -ItemType Directory -Force -Path $temporaryDirectory, $miseDirectory | Out-Null

  try {
    $asset = "mise-v$miseVersion-windows-$architecture.zip"
    $url = "https://github.com/jdx/mise/releases/download/v$miseVersion/$asset"
    Write-Host "Downloading mise v$miseVersion for windows-$architecture..."
    Invoke-WebRequest -Uri $url -OutFile $archivePath

    $actualChecksum = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualChecksum -ne $expectedChecksum.ToLowerInvariant()) {
      throw "Checksum mismatch for $asset. Expected $expectedChecksum, got $actualChecksum."
    }

    Expand-Archive -LiteralPath $archivePath -DestinationPath $temporaryDirectory -Force
    $extractedMise = Get-ChildItem -LiteralPath $temporaryDirectory -Recurse -File -Filter "mise.exe" |
      Select-Object -First 1
    if (-not $extractedMise) {
      throw "The mise archive did not contain mise.exe."
    }
    Copy-Item -LiteralPath $extractedMise.FullName -Destination $misePath -Force
  }
  finally {
    $resolvedToolsRoot = [System.IO.Path]::GetFullPath($toolsRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar)
    $resolvedTemporaryDirectory = [System.IO.Path]::GetFullPath($temporaryDirectory)
    if ($resolvedTemporaryDirectory.StartsWith("$resolvedToolsRoot$([System.IO.Path]::DirectorySeparatorChar).tmp-")) {
      Remove-Item -LiteralPath $resolvedTemporaryDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

if (-not (Test-Path -LiteralPath $miseShimPath)) {
  Copy-Item -LiteralPath $misePath -Destination $miseShimPath
}

$env:MISE_DATA_DIR = Join-Path $toolsRoot "mise-data"
$env:MISE_CACHE_DIR = Join-Path $toolsRoot "mise-cache"
$env:MISE_CONFIG_DIR = Join-Path $toolsRoot "mise-config"
$env:MISE_STATE_DIR = Join-Path $toolsRoot "mise-state"
$env:MISE_YES = "1"
$env:Path = "$miseDirectory$([System.IO.Path]::PathSeparator)$env:Path"

New-Item -ItemType Directory -Force -Path `
  $env:MISE_DATA_DIR, $env:MISE_CACHE_DIR, $env:MISE_CONFIG_DIR, $env:MISE_STATE_DIR | Out-Null

[string[]] $taskArguments = if ($args.Count -eq 0) { @("setup") } else { @($args) }

Push-Location $repoRoot
try {
  Invoke-CheckedCommand -Command $misePath -CommandArguments @("trust", ".\mise.toml")
  $env:MISE_CONFIG_FILE = "mise.toml"
  Invoke-CheckedCommand -Command $misePath -CommandArguments @("install", "task")
  Invoke-CheckedCommand -Command $misePath -CommandArguments @("install", "node")

  [string] $taskPath = (& $misePath "which" "task").Trim()
  if ($LASTEXITCODE -ne 0 -or -not $taskPath) {
    throw "mise could not locate the installed Task executable."
  }
  [string] $nodePath = (& $misePath "which" "node").Trim()
  if ($LASTEXITCODE -ne 0 -or -not $nodePath) {
    throw "mise could not locate the installed Node executable."
  }
  $env:MISE_BIN = $misePath
  $env:TASK_BIN = $taskPath
  $env:NODE_BIN = $nodePath
  $env:NPM_BIN = Join-Path (Split-Path -Parent $nodePath) "npm.cmd"
  $env:Path = "$(Split-Path -Parent $taskPath)$([System.IO.Path]::PathSeparator)$(Split-Path -Parent $nodePath)$([System.IO.Path]::PathSeparator)$env:Path"
  Invoke-CheckedCommand -Command $taskPath -CommandArguments $taskArguments
}
finally {
  Pop-Location
}
