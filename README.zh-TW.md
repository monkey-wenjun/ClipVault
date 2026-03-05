<div align="center">
  <img src="https://socialify.git.ci/monkey-wenjun/ClipVault/image?description=1&descriptionEditable=%E8%B7%A8%E5%B9%B3%E8%87%BA%E5%89%AA%E8%B2%BC%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7%EF%BC%8C%E5%9C%96%E5%BA%8A%E4%B8%8A%E5%82%B3%E3%80%81%E8%A8%AD%E5%AE%9A%E5%90%8C%E6%AD%A5%E3%80%82&font=Jost&forks=1&logo=https%3A%2F%2Fgithub.com%2Fmonkey-wenjun%2FClipVault%2Fblob%2Fmaster%2Fpublic%2Flogo.png%3Fraw%3Dtrue&name=1&pattern=Floating+Cogs&stargazers=1&theme=Auto" alt="ClipVault" width="640" height="320" />

  <br/>

  <div>
    <a href="https://github.com/monkey-wenjun/ClipVault/releases/latest">
      <img src="https://img.shields.io/github/package-json/v/monkey-wenjun/ClipVault?style=flat-square&color=0f8bf9" alt="Release" />
    </a>
    <a href="./LICENSE">
      <img src="https://img.shields.io/github/license/monkey-wenjun/ClipVault?style=flat-square&color=0f8bf9" alt="License" />
    </a>
  </div>

  <div>
    <a href="./README.md">简体中文</a> | 繁體中文 | <a href="./README.ja-JP.md">日本語</a> | <a href="./README.en-US.md">English</a>
  </div>

  <br/>
</div>

## 功能概述

ClipVault 是一款基於 EcoPaste 開發的強大開源剪貼簿管理工具，支持多平台。

### 🚀 主要功能

- 📋 **剪貼簿歷史管理** - 自動保存文本、圖片、文件歷史
- 🏷️ **自訂標籤** - 為剪貼簿項目添加彩色標籤進行分類
- 🖼️ **圖床功能** - 一鍵上傳至阿里雲 OSS、七牛雲
- 🔒 **密碼保護** - 自動排除 1Password、KeePass 等密碼管理器
- 🔄 **設定同步** - 使用 WebDAV/剪貼板在多台設備間同步設定
- 🔐 **數據加密** - 使用 AES-256-GCM 加密數據
- 🌐 **多語言支持** - 簡體中文、繁體中文、English、日本語

### 📥 下載安裝

| 平台 | 下載 |
|:---:|:---|
| Windows | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_x64-setup.exe) |
| macOS | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_x64.dmg) \| [aarch64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_aarch64.dmg) |
| Linux | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_amd64.deb) \| [aarch64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_arm64.deb) |

### 💝 贊助支持

> **關於作者**：這款軟體是我在**失業期間**完成的。如果你發現 ClipVault 對你有幫助，歡迎請我喝杯咖啡 ☕️，這將是對我最大的鼓勵！

<div align="center">

| 微信支付 | 支付寶 |
|:--------:|:------:|
| ![微信支付](./wechat.jpg) | ![支付寶](./alipay.jpg) |

</div>

**你的支持將用於：**
- ☕️ 買杯咖啡保持開發動力
- 🚀 伺服器和域名費用
- 💡 持續開發新功能

感謝每一位支持者的鼓勵！

---

## 🙏 致謝

- [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) - 基礎架構和核心功能
- [Tauri](https://tauri.app/) - 跨平台桌面應用程式框架
- [React](https://react.dev/) - 前端 UI 框架
- [Ant Design](https://ant.design/) - 組件庫

---

## 🗑️ 週期刪除說明

ClipVault 支援自動清理歷史記錄，幫助你管理儲存空間：

### 配置方法

1. 打開偏好設定 → 歷史記錄
2. 設定保留時長（支援天/週/月/年）
3. 設定最大條數限制（可選）

### 清理規則

- ⏰ **時間清理**：超過設定時長的歷史記錄自動刪除
- 📊 **數量清理**：超過最大條數時，自動刪除最舊的內容
- 🖼️ **圖片清理**：刪除歷史記錄時，同時清理本地儲存的圖片檔案

### 注意事項

- 刪除操作不可恢復，請確保已備份重要內容
- 建議開啟同步功能，防止資料遺失
- 清理操作在應用程式啟動時自動執行

---

## 📄 授權

本專案採用 [Apache-2.0](./LICENSE) 授權。

本專案包含來自 [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 的程式碼，版權屬於 EcoPasteHub 及其貢獻者。

---

<p align="center">
  Made with ❤️ by ClipVault Team
</p>
