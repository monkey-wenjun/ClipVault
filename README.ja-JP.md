<div align="center">
  <img src="https://socialify.git.ci/monkey-wenjun/ClipVault/image?description=1&descriptionEditable=%E3%82%AF%E3%83%AD%E3%82%B9%E3%83%97%E3%83%A9%E3%83%83%E3%83%88%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0%E3%81%AE%E8%B8%8A%E5%8A%9B%E7%9A%84%E3%81%AA%E3%82%AF%E3%83%AA%E3%83%83%E3%83%97%E3%83%9C%E3%83%BC%E3%83%89%E7%AE%A1%E7%90%86%E3%83%84%E3%83%BC%E3%83%AB%E3%80%82&font=Jost&forks=1&logo=https%3A%2F%2Fgithub.com%2Fmonkey-wenjun%2FClipVault%2Fblob%2Fmaster%2Fpublic%2Flogo.png%3Fraw%3Dtrue&name=1&pattern=Floating+Cogs&stargazers=1&theme=Auto" alt="ClipVault" width="640" height="320" />

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
    <a href="./README.md">简体中文</a> | <a href="./README.zh-TW.md">繁體中文</a> | 日本語 | <a href="./README.en-US.md">English</a>
  </div>

  <br/>
</div>

## 機能概要

ClipVault は、EcoPaste をベースに開発された強力なオープンソースのクリップボード管理ツールで、複数のプラットフォームに対応しています。

### 🚀 主な機能

- 📋 **クリップボード履歴管理** - テキスト、画像、ファイルの履歴を自動保存
- 🏷️ **カスタムタグ** - クリップボード項目にカラータグを付けて分類
- 🖼️ **画像ホスティング** - Aliyun OSS、Qiniu へワンクリックアップロード
- 🔒 **パスワード保護** - 1Password、KeePass などのパスワードマネージャーを自動除外
- 🔄 **設定同期** - WebDAV/剪贴板を使用して複数デバイス間で設定を同期
- 🔐 **暗号化** - AES-256-GCM でデータを暗号化
- 🌐 **多言語対応** - 简体中文、繁體中文、English、日本語

### 📥 ダウンロード

| プラットフォーム | ダウンロード |
|:---:|:---|
| Windows | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_x64-setup.exe) |
| macOS | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_x64.dmg) \| [aarch64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_aarch64.dmg) |
| Linux | [x64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_amd64.deb) \| [aarch64](https://github.com/monkey-wenjun/ClipVault/releases/latest/download/ClipVault_1.0.0_arm64.deb) |

### 💝 スポンサー支援

> **作者について**：このソフトウェアは**失業中**に開発されました。ClipVault が役立つと感じた場合は、コーヒー ☕️ をおごっていただけると大変励みになります！

<div align="center">

| WeChat Pay | Alipay |
|:----------:|:------:|
| ![WeChat Pay](./wechat.jpg) | ![Alipay](./alipay.jpg) |

</div>

**あなたの支援は以下に使用されます：**
- ☕️ コーヒーを買って開発を続けるため
- 🚀 サーバーとドメイン費用
- 💡 新機能の継続的な開発

ご支援いただいた皆様に心から感謝申し上げます！

---

## 🙏 謝辞

- [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) - 基本アーキテクチャとコア機能
- [Tauri](https://tauri.app/) - クロスプラットフォームデスクトップアプリケーションフレームワーク
- [React](https://react.dev/) - フロントエンド UI フレームワーク
- [Ant Design](https://ant.design/) - コンポーネントライブラリ

---

## 🗑️ 定期的な削除

ClipVault はストレージスペースを管理するために、履歴記録の自動クリーンアップをサポートしています：

### 設定方法

1. 設定 → 履歴 を開く
2. 保持期間を設定（日/週/月/年をサポート）
3. 最大項目数を設定（オプション）

### クリーンアップルール

- ⏰ **時間ベース**：設定された期間より古い記録は自動的に削除されます
- 📊 **数量ベース**：最大数を超えた場合、最も古い項目が削除されます
- 🖼️ **画像クリーンアップ**：履歴を削除するとき、ローカルに保存された画像もクリーンアップされます

### 注意事項

- 削除された項目は復元できません。重要なコンテンツはバックアップしてください
- データ損失を防ぐために同期機能を有効にすることをお勧めします
- クリーンアップはアプリ起動時に自動的に実行されます

---

## 📄 ライセンス

このプロジェクトは [Apache-2.0](./LICENSE) ライセンスの下でライセンスされています。

このプロジェクトには [EcoPaste](https://github.com/EcoPasteHub/EcoPaste) のコードが含まれており、著作権は EcoPasteHub とその貢献者に帰属します。

---

<p align="center">
  Made with ❤️ by ClipVault Team
</p>
