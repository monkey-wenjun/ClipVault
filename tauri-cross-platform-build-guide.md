# Tauri 跨平台构建避坑指南：从 Biome 到 Rust 链接的全流程踩坑记录

在开发 [ClipVault](https://github.com/monkey-wenjun/ClipVault) 这款跨平台剪贴板管理工具时，我经历了从代码规范检查到多平台编译的完整踩坑过程。本文记录了从 Biome CI 检查失败到 Rust 跨平台链接错误的完整解决方案。

## 项目背景

- **技术栈**: Tauri 2.0 + React + Rust
- **目标平台**: Windows (x86/x64/ARM64) + macOS (Intel/Apple Silicon) + Linux (x64/ARM64)
- **CI/CD**: GitHub Actions

---

## 坑点一：Biome CI 版本不匹配与代码规范

### 问题现象

GitHub Actions 运行 `biome ci .` 时报错：

```
Notice: The configuration schema version does not match the CLI version 2.4.6
Expected: 2.4.6, Found: 2.2.6
```

同时伴随大量代码风格错误：
- `Error: The properties are not sorted.` (CSS 属性未排序)
- `Error: The object properties are not sorted by key.` (对象键未排序)
- `Error: Provide an explicit type attribute for the button element.` (按钮缺少 type 属性)

### 原因分析

1. **版本不一致**: 本地 Biome 版本 (2.2.6) 与 CI 环境 (2.4.6) 不匹配
2. **严格规则**: Biome 默认启用 `useSortedProperties` 和 `useSortedKeys` 等严格规则
3. **dist 目录**: 构建输出目录被错误地纳入检查范围

### 解决方案

#### 1. 统一版本

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.4.6/schema.json"
}
```

```bash
# 升级本地 Biome
pnpm add -D @biomejs/biome@2.4.6
```

#### 2. 排除不需要检查的文件

```json
// biome.json
{
  "files": {
    "includes": ["**", "!package.json", "!.release-it.ts", "!dist/**", "!scripts/auto-fix.js"]
  }
}
```

#### 3. 自动修复代码风格

```bash
pnpm biome check --write --unsafe .
```

---

## 坑点二：Rust 跨平台链接器配置错误

### 问题现象

Linux 构建时报错：

```
error: linking with `cc` failed: exit status: 1
rust-lld: error: cannot open /FORCE:MULTIPLE: No such file or directory
collect2: error: ld returned 1 exit status
```

### 原因分析

`/FORCE:MULTIPLE` 是 **Windows MSVC 链接器专用选项**，用于强制允许多个定义。当该选项被错误地传递给 Linux 的 `ld` 链接器时会导致构建失败。

### 解决方案

使用 Cargo 的条件目标配置：

```toml
# .cargo/config.toml

# Windows 目标需要 /FORCE:MULTIPLE 链接器选项
[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

[target.i686-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

[target.aarch64-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

# Linux ARM 目标配置
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

---

## 坑点三：LTO 与动态链接冲突

### 问题现象

macOS 和 Linux 构建报错：

```
error: cannot prefer dynamic linking when performing LTO
note: only 'staticlib', 'bin', and 'cdylib' outputs are supported with LTO
```

### 原因分析

`prefer-dynamic`（偏好动态链接）与 `lto = true`（链接时优化）存在冲突。

### 解决方案

使用 Thin LTO：

```toml
[profile.release]
strip = true
lto = "thin"  # 从 true 改为 "thin"
opt-level = 3
```

---

## 坑点四：Ubuntu ARM64 交叉编译 apt 源配置

### 问题现象

Linux ARM64 交叉编译时 apt 安装失败：

```
E: Failed to fetch https://security.ubuntu.com/ubuntu/dists/jammy/main/binary-arm64/Packages  404  Not Found
E: Failed to fetch https://security.ubuntu.com/ubuntu/dists/jammy-updates/main/binary-arm64/Packages  404  Not Found
```

### 原因分析

Ubuntu 22.04 的默认源仅包含 x86_64 架构，ARM64 软件包托管在 `ports.ubuntu.com` 上。

### 解决方案

```yaml
# .github/workflows/release.yml
- name: Install ARM cross-compile dependencies
  if: matrix.target == 'aarch64-unknown-linux-gnu'
  run: |
    sudo dpkg --add-architecture arm64
    # 关键：切换 apt 源到 ports.ubuntu.com
    sudo sed -i 's|http://archive.ubuntu.com/ubuntu/|http://ports.ubuntu.com/ubuntu-ports/|g' /etc/apt/sources.list
    sudo sed -i 's|http://security.ubuntu.com/ubuntu/|http://ports.ubuntu.com/ubuntu-ports/|g' /etc/apt/sources.list
    sudo apt-get update || true
    sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
    sudo apt-get install -y libwebkit2gtk-4.1-dev:arm64 libappindicator3-dev:arm64 librsvg2-dev:arm64 patchelf || true
```

---

## 坑点五：OpenSSL ARM64 开发库缺失

### 问题现象

Linux ARM64 交叉编译时 Rust 构建失败：

```
error: failed to run custom build command for `openssl-sys v0.9.x`

  --- stdout
  cargo:rerun-if-env-changed=AARCH64_UNKNOWN_LINUX_GNU_OPENSSL_LIB_DIR
  AARCH64_UNKNOWN_LINUX_GNU_OPENSSL_LIB_DIR unset

  --- stderr
  Package openssl was not found in the pkg-config search path.
  Perhaps you should add the directory containing `openssl.pc`
  to the PKG_CONFIG_PATH environment variable

  It looks like you're compiling on Linux, but the OpenSSL library
  could not be found. You can try installing the OpenSSL development
  package:

      sudo apt-get install pkg-config libssl-dev
      # On Arch Linux
      sudo pacman -S pkgconf openssl
      # On Fedora
      sudo dnf install pkgconf perl-FindBin perl-IPC-Cmd openssl-devel
      # On Alpine Linux
      apk add pkgconf openssl-dev

  See rust-openssl documentation for more information:
      https://docs.rs/openssl
```

### 原因分析

1. **缺少 ARM64 OpenSSL 库**：交叉编译时需要目标架构的 OpenSSL 开发库
2. **环境变量未配置**：`OPENSSL_DIR`、`OPENSSL_LIB_DIR` 等环境变量指向错误
3. **pkg-config 路径错误**：交叉编译时 `pkg-config` 需要指向目标架构的 `.pc` 文件

### 解决方案

#### 1. 安装 ARM64 OpenSSL 开发库

```yaml
# .github/workflows/release.yml
- name: Install ARM cross-compile dependencies
  if: matrix.target == 'aarch64-unknown-linux-gnu'
  run: |
    sudo dpkg --add-architecture arm64
    # 切换 apt 源到 ports.ubuntu.com
    sudo sed -i 's|archive.ubuntu.com|ports.ubuntu.com/ubuntu-ports|g' /etc/apt/sources.list
    sudo sed -i 's|security.ubuntu.com|ports.ubuntu.com/ubuntu-ports|g' /etc/apt/sources.list
    sudo apt-get update || true
    sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
    # 关键：安装 ARM64 OpenSSL 开发库
    sudo apt-get install -y libssl-dev:arm64 || true
    sudo apt-get install -y libwebkit2gtk-4.1-dev:arm64 libappindicator3-dev:arm64 librsvg2-dev:arm64 patchelf || true
```

#### 2. 配置 OpenSSL 环境变量

```yaml
- name: Setup ARM cross-compile env
  if: matrix.target == 'aarch64-unknown-linux-gnu'
  run: |
    # 基础交叉编译变量
    echo "CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc" >> $GITHUB_ENV
    echo "CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc" >> $GITHUB_ENV
    echo "CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++" >> $GITHUB_ENV
    # pkg-config 配置
    echo "PKG_CONFIG_SYSROOT_DIR=/usr/aarch64-linux-gnu" >> $GITHUB_ENV
    echo "PKG_CONFIG_PATH=/usr/lib/aarch64-linux-gnu/pkgconfig" >> $GITHUB_ENV
    echo "PKG_CONFIG_ALLOW_CROSS=1" >> $GITHUB_ENV
    # 关键：OpenSSL 路径配置
    echo "OPENSSL_DIR=/usr" >> $GITHUB_ENV
    echo "OPENSSL_INCLUDE_DIR=/usr/include" >> $GITHUB_ENV
    echo "OPENSSL_LIB_DIR=/usr/lib/aarch64-linux-gnu" >> $GITHUB_ENV
```

#### 3. 备选方案：使用 vendored OpenSSL

如果系统 OpenSSL 安装困难，可以在 `Cargo.toml` 中使用静态编译的 OpenSSL：

```toml
[dependencies]
openssl = { version = "0.10", features = ["vendored"] }
```

**注意**：使用 `vendored` 会增加编译时间和二进制大小，但能避免系统依赖问题。

---

## 完整配置参考

### .github/workflows/release.yml

```yaml
name: Release CI

on:
  push:
    tags:
      - "v*"

jobs:
  build-app:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: "macos-latest"
            target: "aarch64-apple-darwin"
          - platform: "macos-latest"
            target: "x86_64-apple-darwin"
          - platform: "windows-latest"
            target: "x86_64-pc-windows-msvc"
          - platform: "windows-latest"
            target: "i686-pc-windows-msvc"
          - platform: "windows-latest"
            target: "aarch64-pc-windows-msvc"
          - platform: "ubuntu-22.04"
            target: "x86_64-unknown-linux-gnu"
          - platform: "ubuntu-22.04"
            target: "aarch64-unknown-linux-gnu"

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v3
        with:
          version: latest

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install ARM cross-compile dependencies
        if: matrix.target == 'aarch64-unknown-linux-gnu'
        run: |
          sudo dpkg --add-architecture arm64
          sudo sed -i 's|archive.ubuntu.com|ports.ubuntu.com/ubuntu-ports|g' /etc/apt/sources.list
          sudo sed -i 's|security.ubuntu.com|ports.ubuntu.com/ubuntu-ports|g' /etc/apt/sources.list
          sudo apt-get update || true
          sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
          sudo apt-get install -y libssl-dev:arm64 || true
          sudo apt-get install -y libwebkit2gtk-4.1-dev:arm64 libappindicator3-dev:arm64 librsvg2-dev:arm64 patchelf || true

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri/target
          key: ${{ matrix.target }}

      - name: Setup ARM cross-compile env
        if: matrix.target == 'aarch64-unknown-linux-gnu'
        run: |
          echo "CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc" >> $GITHUB_ENV
          echo "CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc" >> $GITHUB_ENV
          echo "CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++" >> $GITHUB_ENV
          echo "PKG_CONFIG_SYSROOT_DIR=/usr/aarch64-linux-gnu" >> $GITHUB_ENV
          echo "PKG_CONFIG_PATH=/usr/lib/aarch64-linux-gnu/pkgconfig" >> $GITHUB_ENV
          echo "PKG_CONFIG_ALLOW_CROSS=1" >> $GITHUB_ENV
          echo "OPENSSL_DIR=/usr" >> $GITHUB_ENV
          echo "OPENSSL_INCLUDE_DIR=/usr/include" >> $GITHUB_ENV
          echo "OPENSSL_LIB_DIR=/usr/lib/aarch64-linux-gnu" >> $GITHUB_ENV

      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          CI: false
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "ClipVault ${{ github.ref_name }}"
          releaseDraft: false
          prerelease: false
          args: --target ${{ matrix.target }}
```

### .cargo/config.toml

```toml
# Windows 目标需要 /FORCE:MULTIPLE 链接器选项
[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

[target.i686-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

[target.aarch64-pc-windows-msvc]
rustflags = ["-C", "link-arg=/FORCE:MULTIPLE"]

# Linux ARM 目标配置
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"

# macOS 目标配置
[target.aarch64-apple-darwin]
linker = "clang"
rustflags = ["-C", "link-arg=-arch", "-C", "link-arg=arm64"]

[target.x86_64-apple-darwin]
linker = "clang"
rustflags = ["-C", "link-arg=-arch", "-C", "link-arg=x86_64"]

[profile.release]
strip = true
lto = "thin"
opt-level = 3
```

---

## 构建矩阵总结

| 平台 | 架构 | Rust Target | 特殊配置 |
|------|------|-------------|---------|
| Windows | x86_64 | `x86_64-pc-windows-msvc` | `/FORCE:MULTIPLE` |
| Windows | x86 | `i686-pc-windows-msvc` | `/FORCE:MULTIPLE` |
| Windows | ARM64 | `aarch64-pc-windows-msvc` | `/FORCE:MULTIPLE` |
| macOS | Intel | `x86_64-apple-darwin` | `clang` + arch 标志 |
| macOS | Apple Silicon | `aarch64-apple-darwin` | `clang` + arch 标志 |
| Linux | x86_64 | `x86_64-unknown-linux-gnu` | 默认配置 |
| Linux | ARM64 | `aarch64-unknown-linux-gnu` | `ports.ubuntu.com` + OpenSSL ARM64 + 交叉编译工具链 |

---

## 总结

Tauri 跨平台构建的 5 个核心要点：

1. **代码规范**: 保持 Biome/Prettier 版本一致，排除构建输出目录
2. **链接器配置**: 使用 Cargo 条件目标配置，避免 Windows 专用选项污染其他平台
3. **LTO 策略**: 使用 `thin` LTO 平衡构建速度和二进制优化
4. **交叉编译源**: Ubuntu ARM64 需要切换到 `ports.ubuntu.com` 源
5. **OpenSSL 依赖**: 交叉编译时需要安装目标架构的 OpenSSL 开发库并配置正确环境变量

完整代码可参考 [ClipVault GitHub 仓库](https://github.com/monkey-wenjun/ClipVault)。

---

*本文基于 Tauri 2.0 + GitHub Actions 的实战经验编写，涵盖了从 Biome CI 检查到 Rust 跨平台链接的全流程踩坑记录。*
