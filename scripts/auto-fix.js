#!/usr/bin/env node
/**
 * GitHub Actions 自动修复助手
 * 分析 Actions 日志并提供修复建议或直接修复
 *
 * 使用方式:
 *   node scripts/auto-fix.js [log-file]
 *   或从剪贴板读取: node scripts/auto-fix.js --clipboard
 */

const fs = require("node:fs");
const _path = require("node:path");

// 修复规则库
const FIX_RULES = [
  {
    autoFixable: false,
    checkFiles: ["src-tauri/tauri.conf.json"],
    description: "Tauri Updater 的私钥格式不正确，缺少必需的注释行",
    id: "updater-signing-key",
    name: "Tauri 签名密钥错误",
    patterns: [
      "Missing comment in secret key",
      "failed to decode secret key",
      "incorrect updater private key",
    ],
    severity: "error",
    solution: `
【解决方案】
1. 在项目根目录执行重新生成密钥:
   pnpm tauri signer generate -w .tauri/ecopaste.key --force

2. 查看新生成的私钥:
   cat .tauri/ecopaste.key
   
   应该包含:
   untrusted comment: minisign encrypted secret key
   RWRTY0IyHzL3ifZJ4zK096DZPWQzBDgNU9QK5Jz...

3. 更新 GitHub Secret:
   - 进入 https://github.com/monkey-wenjun/ClipVault/settings/secrets/actions
   - 更新 TAURI_PRIVATE_KEY（必须包含 untrusted comment: 行）
   - TAURI_KEY_PASSWORD 留空（如果生成时没设密码）

4. 查看公钥并更新 tauri.conf.json:
   cat .tauri/ecopaste.key.pub
   
   复制内容更新到 src-tauri/tauri.conf.json 中的 plugins.updater.pubkey
    `,
  },
  {
    autoFixable: false,
    checkFiles: ["src-tauri/src/**/*.rs"],
    description: "Rust 代码存在编译错误",
    id: "rust-compile-error",
    name: "Rust 编译错误",
    patterns: [
      "error[E",
      "Compiling .* failed",
      "could not compile",
      "rustc exited with code",
    ],
    severity: "error",
    solution: "需要查看具体错误信息，修复 Rust 源代码中的问题",
  },
  {
    autoFix: async () => {
      const { execSync } = require("node:child_process");
      try {
        execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" });
        return true;
      } catch (_e) {
        return false;
      }
    },
    autoFixable: true,
    description: "pnpm 依赖安装失败或 lock 文件不一致",
    id: "pnpm-install-failed",
    name: "依赖安装失败",
    patterns: [
      "ERR_PNPM_",
      "pnpm install failed",
      "lockfile is not up to date",
    ],
    severity: "warning",
  },
  {
    autoFixable: false,
    description: "GitHub Actions 运行器磁盘空间不足",
    id: "disk-space",
    name: "磁盘空间不足",
    patterns: ["No space left on device", "ENOSPC"],
    severity: "error",
    solution: `
【解决方案】
在工作流中添加清理步骤:

- name: Free disk space
  run: |
    rm -rf target/release/build
    rm -rf node_modules/.cache
    rm -rf /tmp/*
    `,
  },
  {
    autoFixable: false,
    description: "GitHub Actions 缺少必需的 Secret",
    id: "missing-secret",
    name: "GitHub Secret 缺失",
    patterns: [
      "secrets.RELEASE_TOKEN",
      "Input required and not supplied",
      "GITHUB_TOKEN",
    ],
    severity: "error",
    solution: `
【解决方案】
进入仓库设置添加 Secret:
https://github.com/monkey-wenjun/ClipVault/settings/secrets/actions

需要配置的 Secret:
- RELEASE_TOKEN: 用于发布 Release 的 Personal Access Token
- TAURI_PRIVATE_KEY: Tauri 更新器私钥
- TAURI_KEY_PASSWORD: Tauri 更新器私钥密码（可选）
    `,
  },
];

// 分析日志内容
function analyzeLog(logContent) {
  const detectedIssues = [];

  for (const rule of FIX_RULES) {
    const matched = rule.patterns.some((pattern) =>
      logContent.includes(pattern),
    );

    if (matched) {
      detectedIssues.push(rule);
    }
  }

  return detectedIssues;
}

// 生成修复报告
function generateReport(issues) {
  if (issues.length === 0) {
    return `
✅ 未检测到已知类型的错误

可能的原因:
- 新的错误类型不在规则库中
- 日志中缺少错误详情

建议: 手动查看完整日志或提供更多信息
    `.trim();
  }

  let report = `
🔍 检测到 ${issues.length} 个问题:
${"=".repeat(50)}

  `;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    report += `
${i + 1}. ${issue.name} [${issue.severity.toUpperCase()}]
   描述: ${issue.description}
   可自动修复: ${issue.autoFixable ? "✅ 是" : "❌ 否"}
   
   ${issue.solution || ""}
    `;
  }

  return report;
}

// 尝试自动修复
async function tryAutoFix(issues) {
  const fixableIssues = issues.filter((i) => i.autoFixable && i.autoFix);

  if (fixableIssues.length === 0) {
    return false;
  }

  let fixedCount = 0;
  for (const issue of fixableIssues) {
    const success = await issue.autoFix();
    if (success) fixedCount++;
  }
  return fixedCount > 0;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  let logContent = "";

  // 读取日志来源
  if (args.includes("--clipboard")) {
    process.stdin.setEncoding("utf-8");

    const chunks = [];
    for await (const chunk of process.stdin) {
      if (chunk.trim() === "END") break;
      chunks.push(chunk);
    }
    logContent = chunks.join("");
  } else if (args[0] && fs.existsSync(args[0])) {
    logContent = fs.readFileSync(args[0], "utf-8");
  } else {
    // 尝试读取默认位置
    const defaultLog = ".github/logs/latest.log";
    if (fs.existsSync(defaultLog)) {
      logContent = fs.readFileSync(defaultLog, "utf-8");
    } else {
      process.exit(1);
    }
  }
  const issues = analyzeLog(logContent);

  // 生成报告
  const report = generateReport(issues);

  // 询问是否尝试自动修复
  if (issues.some((i) => i.autoFixable)) {
    // 这里可以添加交互式确认，简化版直接尝试
    await tryAutoFix(issues);
  }

  // 保存分析报告
  const reportPath = ".github/logs/analysis-report.txt";
  fs.writeFileSync(reportPath, report);
}

main().catch(console.error);
