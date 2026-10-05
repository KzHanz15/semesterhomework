# 星空天文馆 本地静态服务器（纯 PowerShell 实现，无需安装 Node）
# 用法：powershell -ExecutionPolicy Bypass -File start-server.ps1
# 默认端口 8080，可通过参数覆盖：powershell -ExecutionPolicy Bypass -File start-server.ps1 -Port 9000

param([int]$Port = 8080)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".webp" = "image/webp"
  ".ico"  = "image/x-icon"
  ".md"   = "text/markdown; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Server running at $prefix (root: $root)  — 按 Ctrl+C 停止"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $rel = $req.Url.AbsolutePath.TrimStart("/")
    if ($rel -eq "") { $rel = "index.html" }
    # 防目录穿越
    $rel = $rel.Replace("..", "").TrimStart("/")
    $full = Join-Path $root $rel

    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
      else { $res.ContentType = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.StatusCode = 200
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.OutputStream.Close()
    $res.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
