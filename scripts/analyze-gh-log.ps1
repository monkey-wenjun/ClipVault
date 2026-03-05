# GitHub Actions 日志分析助手 (PowerShell)
# 快速分析 GitHub Actions 失败日志

param(
    [Parameter()]
    [string]$RunId,
    
    [Parameter()]
    [switch]$Latest,
    
    [Parameter()]
    [switch]$AutoFix
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 GitHub Actions 日志分析助手" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# 检查 gh CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 请先安装 GitHub CLI: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# 获取 Run ID
if (-not $RunId) {
    if ($Latest) {
        Write-Host "📋 获取最近的工作流运行..." -ForegroundColor Yellow
        $runs = gh run list --limit 1 --json databaseId,status,conclusion -q '.[0]'
        $runInfo = $runs | ConvertFrom-Json
        $RunId = $runInfo.databaseId
        Write-Host "✅ 找到最近运行: $RunId (状态: $($runInfo.status), 结果: $($runInfo.conclusion))" -ForegroundColor Green
    } else {
        Write-Host "📋 可用的最近工作流运行:" -ForegroundColor Yellow
        gh run list --limit 5
        Write-Host ""
        $RunId = Read-Host "请输入要分析的 Run ID"
    }
}

# 创建日志目录
New-Item -ItemType Directory -Force -Path ".github/logs" | Out-Null

# 下载日志
$logFile = ".github/logs/run-$RunId.log"
Write-Host "`n📥 下载日志到 $logFile ..." -ForegroundColor Yellow

try {
    gh run view $RunId --log > $logFile 2>&1
    Write-Host "✅ 日志下载完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 下载日志失败: $_" -ForegroundColor Red
    exit 1
}

# 分析日志
Write-Host "`n🔍 分析日志中..." -ForegroundColor Yellow

# 快速检测常见问题
$logContent = Get-Content $logFile -Raw
$issues = @()

# 检查签名密钥错误
if ($logContent -match "Missing comment in secret key") {
    $issues += @{
        Type = "签名密钥错误"
        Severity = "Critical"
        Pattern = "Missing comment in secret key"
        Solution = @"
【Tauri 签名密钥错误 - 立即修复】

原因: GitHub Secret TAURI_PRIVATE_KEY 格式不正确，缺少必需的注释行

修复步骤:
1. 本地重新生成密钥:
   pnpm tauri signer generate -w .tauri/ecopaste.key --force

2. 查看私钥确认格式:
   Get-Content .tauri/ecopaste.key -Raw
   
   应该包含:
   untrusted comment: minisign encrypted secret key
   RWRTY0IyHz...

3. 更新 GitHub Secret:
   访问: https://github.com/monkey-wenjun/ClipVault/settings/secrets/actions
   更新 TAURI_PRIVATE_KEY 为私钥完整内容（必须包含 untrusted comment: 行）

4. 查看公钥并更新 tauri.conf.json:
   Get-Content .tauri/ecopaste.key.pub -Raw
   
   更新 src-tauri/tauri.conf.json 中的 plugins.updater.pubkey
"@
    }
}

# 检查 Rust 编译错误
if ($logContent -match "error\[E\d+\]" -or $logContent -match "could not compile") {
    $errorMatches = [regex]::Matches($logContent, "error\[E\d+\][^\n]+")
    $errorCount = $errorMatches.Count
    
    $issues += @{
        Type = "Rust 编译错误"
        Severity = "High"
        Pattern = "error[E...]"
        Solution = "检测到 $errorCount 个 Rust 编译错误。请检查 src-tauri/src/ 下的 Rust 代码。"
    }
}

# 检查依赖错误
if ($logContent -match "ERR_PNPM_" -or $logContent -match "lockfile is not up to date") {
    $issues += @{
        Type = "依赖安装错误"
        Severity = "Medium"
        Pattern = "ERR_PNPM_"
        Solution = @"
pnpm 依赖问题，尝试本地修复:
pnpm install --no-frozen-lockfile
然后提交更新后的 pnpm-lock.yaml
"@
    }
}

# 检查磁盘空间
if ($logContent -match "No space left on device") {
    $issues += @{
        Type = "磁盘空间不足"
        Severity = "High"
        Pattern = "No space left on device"
        Solution = @"
GitHub Actions 磁盘空间不足。在 workflow 中添加清理步骤:

- name: Free disk space
  run: |
    rm -rf target/release/build
    rm -rf node_modules/.cache
"@
    }
}

# 显示结果
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "📊 分析结果" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "`n✅ 未检测到已知的常见错误类型" -ForegroundColor Green
    Write-Host "`n可能的原因:" -ForegroundColor Yellow
    Write-Host "  - 新的错误类型不在规则库中"
    Write-Host "  - 日志中没有详细的错误信息"
    Write-Host "`n建议: 手动查看完整日志文件: $logFile" -ForegroundColor Yellow
} else {
    Write-Host "`n检测到 $($issues.Count) 个问题:`n" -ForegroundColor Red
    
    for ($i = 0; $i -lt $issues.Count; $i++) {
        $issue = $issues[$i]
        $color = if ($issue.Severity -eq "Critical") { "Red" } elseif ($issue.Severity -eq "High") { "Magenta" } else { "Yellow" }
        
        Write-Host "$($i + 1). [$($issue.Severity)] $($issue.Type)" -ForegroundColor $color
        Write-Host "   匹配: $($issue.Pattern)`n" -ForegroundColor Gray
        Write-Host "$($issue.Solution)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "-----------------------------------" -ForegroundColor DarkGray
    }
}

# 保存分析报告
$reportFile = ".github/logs/analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$report = @"
GitHub Actions 日志分析报告
==========================

Run ID: $RunId
分析时间: $(Get-Date)

检测到问题数: $($issues.Count)

$($issues | ForEach-Object { 
    "[$($_.Severity)] $($_.Type)`n$($_.Solution)`n`n---`n" 
})
"@

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`n📄 分析报告已保存: $reportFile" -ForegroundColor Green

# 尝试自动修复
if ($AutoFix -and $issues.Count -gt 0) {
    Write-Host "`n🔧 尝试自动修复..." -ForegroundColor Yellow
    
    foreach ($issue in $issues) {
        switch ($issue.Type) {
            "依赖安装错误" {
                Write-Host "→ 尝试修复 pnpm 依赖..." -ForegroundColor Yellow
                try {
                    pnpm install --no-frozen-lockfile
                    Write-Host "✅ 依赖修复完成，请提交 pnpm-lock.yaml" -ForegroundColor Green
                } catch {
                    Write-Host "❌ 自动修复失败: $_" -ForegroundColor Red
                }
            }
            default {
                Write-Host "→ $($issue.Type) 需要手动修复" -ForegroundColor Gray
            }
        }
    }
}

Write-Host "`n✨ 分析完成!" -ForegroundColor Green
