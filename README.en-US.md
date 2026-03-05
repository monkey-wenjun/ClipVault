# ClipVault

<p align="center">
  <img src="./public/logo.png" width="120" alt="ClipVault Logo" />
</p>

<p align="center">
  <b>Clipboard + Image Hosting Management Tool</b>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/version-1.0.0--beta.1-green?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform" />
</p>

> **Note**: This project is based on [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) and is licensed under Apache-2.0. Thanks to the EcoPasteHub team for their open source contribution!

---

## ✨ Features

- 🎨 **Modern UI** - Windows 11 style design, clean and beautiful
- 🏷️ **Custom Tags** - Quickly create tags to categorize clipboard content
- 🖼️ **Image Hosting** - Support Aliyun OSS, Qiniu Cloud, etc. Upload screenshots to cloud with one click
- 🔒 **Encrypted Sync** - AES-256 end-to-end encryption, sync across devices via cloud storage
- ⌨️ **Shortcut Support** - Quick access, navigation, paste, and image hosting upload
- 🚫 **Exclude Apps** - Support setting apps to ignore (e.g., password managers)
- 🌙 **Dark Mode** - Auto-follow system theme
- 🌍 **Multi-language** - Simplified Chinese, Traditional Chinese, English, Japanese

---

## 📥 Download

Download the latest version from the [Releases](https://github.com/yourusername/ClipVault/releases) page.

### Windows
- `.exe` - Installer
- `.msi` - Windows Installer

### macOS
- `.dmg` - Intel
- `.dmg` - Apple Silicon

### Linux
- `.AppImage` - Universal format
- `.deb` - Debian/Ubuntu
- `.rpm` - Fedora/RHEL

---

## 🚀 Quick Start

### Default Shortcuts

| Function | Windows/Linux | macOS |
|----------|--------------|-------|
| Open Clipboard | `Ctrl + Shift + V` | `Cmd + Shift + V` |
| Open Settings | `Alt + X` | `Option + X` |
| Upload to Image Hosting | `Ctrl + Shift + P` | `Cmd + Shift + P` |
| Select Item | `Tab` / `↑↓` | `Tab` / `↑↓` |
| Switch Group | `← / →` | `← / →` |

### Image Hosting Settings

1. Open Preferences → Image Hosting
2. Enable "Enable Image Hosting"
3. Click "Add Image Hosting" to configure your cloud storage
4. Supports: Aliyun OSS, Qiniu Cloud, Tencent Cloud COS, etc.
5. Press `Ctrl + Shift + P` to quickly upload the latest screenshot

### Exclude Settings

1. Open Preferences → Clipboard → Exclusion Settings
2. Add app names to exclude (e.g., 1Password, KeePass)
3. Content copied from these apps will not be recorded

### Sync Settings

1. Open Preferences → Sync
2. Enable "Enable Sync"
3. Select sync directory (recommended to use cloud storage sync folder)
4. Optional: Enable AES-256 encryption

### Tags

1. Click the **+** button on the right side of the top tabs
2. Enter the tag name and press Enter to create
3. Click the tag to filter related content

---

## 🛠️ Development

### Tech Stack

- **Frontend**: React + TypeScript + Ant Design + UnoCSS
- **Backend**: Rust + Tauri v2
- **State Management**: Valtio
- **i18n**: i18next

### Requirements

- Node.js 18+
- Rust 1.70+
- pnpm

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/ClipVault.git
cd ClipVault

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production version
pnpm build
```

---

## 📄 License

This project is licensed under [Apache-2.0](./LICENSE).

This project contains code from [EcoPaste](https://github.com/EcoPasteHub/EcoPaste), copyright belongs to EcoPasteHub and its contributors.

---

## 🙏 Acknowledgements

- [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) - Basic architecture and core functionality
- [Tauri](https://tauri.app/) - Cross-platform desktop application framework
- [React](https://react.dev/) - Frontend UI framework
- [Ant Design](https://ant.design/) - Component library

---

<p align="center">
  Made with ❤️ by ClipVault Team
</p>
