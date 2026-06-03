# Regenerates data/project-images.json from folder contents.
# Run after adding images:  powershell -File scripts/generate-project-images.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$base = Join-Path $root "assets\images\projects"
$ids = @("bachpanshala", "seva", "udaan", "jeev", "prakriti", "vikas")
$ext = @(".jpg", ".jpeg", ".png", ".webp", ".gif")
$projects = @{}

foreach ($id in $ids) {
  $dir = Join-Path $base $id
  $images = @()
  if (Test-Path $dir) {
    Get-ChildItem -Path $dir -File | Where-Object {
      $ext -contains $_.Extension.ToLower()
    } | Sort-Object { $_.Name } | ForEach-Object {
      $images += "assets/images/projects/$id/$($_.Name)"
    }
  }
  $projects[$id] = @{
    id     = $id
    folder = "assets/images/projects/$id"
    images = $images
    cover  = if ($images.Count -gt 0) { $images[0] } else { $null }
  }
}

$out = @{
  source       = "manifest"
  generatedAt  = (Get-Date).ToUniversalTime().ToString("o")
  projects     = $projects
}

$jsonPath = Join-Path $root "data\project-images.json"
$out | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Wrote $jsonPath"
