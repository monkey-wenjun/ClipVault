# ClipVault

<p align="center">
  <img src="./public/logo.png" width="120" alt="ClipVault Logo" />
</p>

<p align="center">
  <b>剪切板+ 图床管理工具</b>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/version-1.0.0--beta.1-green?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform" />
</p>

> **注意**: 本项目是基于 [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 的衍生作品，遵循 Apache-2.0 许可证。感谢 EcoPasteHub 团队的开源贡献！

---

## ✨ 特性

- 🎨 **现代化 UI** - Windows 11 风格设计，简洁美观
- 🏷️ **自定义标签** - 快速创建标签，分类管理剪贴板内容
- 🖼️ **图床管理** - 支持阿里云 OSS、七牛云等，一键上传截图到云端
- 🔒 **加密同步** - AES-256 端到端加密，通过云盘实现跨设备同步
- ⌨️ **快捷键支持** - 快速唤出、导航、粘贴、图床上传
- 🚫 **排除应用** - 支持设置忽略特定应用（如密码管理器）的剪贴板内容
- 🌙 **深色模式** - 自动跟随系统主题
- 🌍 **多语言** - 简体中文、繁体中文、英文、日文

---

## 📥 下载安装

从 [Releases](https://github.com/yourusername/ClipVault/releases) 页面下载最新版本。

### Windows
- `.exe` - 安装程序
- `.msi` - Windows Installer

### macOS
- `.dmg` - Intel 芯片
- `.dmg` - Apple Silicon 芯片

### Linux
- `.AppImage` - 通用格式
- `.deb` - Debian/Ubuntu
- `.rpm` - Fedora/RHEL

---

## 🚀 快速开始

### 默认快捷键

| 功能 | Windows/Linux | macOS |
|------|--------------|-------|
| 打开剪贴板 | `Ctrl + Shift + V` | `Cmd + Shift + V` |
| 打开设置 | `Alt + X` | `Option + X` |
| 上传到图床 | `Ctrl + Shift + P` | `Cmd + Shift + P` |
| 选择条目 | `Tab` / `↑↓` | `Tab` / `↑↓` |
| 切换分组 | `← / →` | `← / →` |

### 标签功能

1. 点击顶部选项卡右侧的 **+** 按钮
2. 输入标签名称，按回车即可创建
3. 点击标签即可筛选相关内容

### 图床设置

1. 打开偏好设置 → 图床设置
2. 启用"启用图床功能"
3. 点击"添加图床"配置您的云存储
4. 支持：阿里云 OSS、七牛云、腾讯云 COS 等
5. 可按 `Ctrl + Shift + P` 快速上传最新截图

### 排除设置

1. 打开偏好设置 → 剪贴板 → 排除设置
2. 添加需要排除的应用名称（如 1Password、KeePass）
3. 从这些应用复制的内容将不会被记录

### 同步设置

1. 打开偏好设置 → 同步
2. 启用"启用同步"
3. 选择同步目录（建议使用云盘同步文件夹）
4. 可选：启用 AES-256 加密

---

## 🛠️ 开发

### 技术栈

- **前端**: React + TypeScript + Ant Design + UnoCSS
- **后端**: Rust + Tauri v2
- **状态管理**: Valtio
- **国际化**: i18next

### 环境要求

- Node.js 18+
- Rust 1.70+
- pnpm

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/ClipVault.git
cd ClipVault

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

---

## 📄 许可证

本项目采用 [Apache-2.0](./LICENSE) 许可证。

本项目包含来自 [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 的代码，版权归属 EcoPasteHub 及其贡献者。

---

## 🙏 致谢

- [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) - 基础架构和核心功能
- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [React](https://react.dev/) - 前端 UI 框架
- [Ant Design](https://ant.design/) - 组件库

---

<p align="center">
  Made with ❤️ by ClipVault Team
</p>
