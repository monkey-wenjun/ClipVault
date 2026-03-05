# Apache-2.0 许可证合规指南

本文档说明如何确保 ClipVault 项目符合 Apache-2.0 许可证要求。

## 关于 Apache-2.0 许可证

Apache-2.0 是一种宽松的开源许可证，允许：
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 专利授权
- ✅ 私人使用

但必须遵守以下条件：

## 合规要求清单

### 1. 保留版权声明 ✅

**已做：**
- [x] 在 README.md 中声明基于 EcoPaste 开发
- [x] 在 NOTICE 文件中列出第三方软件
- [x] 在 LICENSE 文件中保留原始版权声明

**需要维护：**
- 保留源代码中的原始版权声明（如文件头注释）
- 在分发时包含 NOTICE 文件

### 2. 提供许可证副本 ✅

**已做：**
- [x] 项目根目录包含 LICENSE 文件
- [x] README.md 中链接到 LICENSE

### 3. 说明修改内容 ✅

**已做：**
- [x] README.md 中明确说明这是 EcoPaste 的衍生作品
- [x] 本文件记录所有重大修改

**重大修改记录：**

| 版本 | 修改内容 | 日期 |
|------|----------|------|
| 1.0.0-beta.1 | 更换应用图标为 ClipVault 品牌标识 | 2026-03-05 |
| 1.0.0-beta.1 | 添加自定义标签功能 | 2026-03-05 |
| 1.0.0-beta.1 | 重命名为 ClipVault | 2026-03-05 |

### 4. 保留免责声明 ✅

**已做：**
- [x] LICENSE 文件中包含完整的免责声明

## 分发时的要求

当你分发本软件时，必须包含以下文件：

1. **LICENSE** - Apache-2.0 许可证全文
2. **NOTICE** - 第三方软件声明和版权声明
3. **README.md** - 项目说明（建议包含）

## 修改代码时的注意事项

### 修改现有文件

如果修改了来自 EcoPaste 的源文件，应在文件头添加注释：

```typescript
// Copyright 2024 EcoPasteHub
// Modifications Copyright 2025 ClipVault Contributors
// Licensed under the Apache License, Version 2.0
```

### 新增文件

新增文件可以使用标准的版权声明：

```typescript
// Copyright 2025 ClipVault Contributors
// Licensed under the Apache License, Version 2.0
```

## 禁止的行为

以下行为违反 Apache-2.0 许可证：

- ❌ 移除或修改 LICENSE 文件中的版权声明
- ❌ 声称软件完全是你独立开发的
- ❌ 使用原项目的商标（如 EcoPaste 名称或 logo）造成混淆

## 推荐的合规实践

1. **保持透明度**
   - 在显著位置说明项目基于 EcoPaste
   - 链接到原始项目仓库

2. **独立品牌**
   - 使用不同的应用名称（ClipVault ✅）
   - 使用不同的图标和品牌标识
   - 避免让用户误以为是官方版本

3. **贡献回馈**
   - 考虑将通用改进提交给上游 EcoPaste 项目
   - 在 README 中感谢原始作者

4. **定期审查**
   - 确保所有分发的版本都包含 LICENSE 和 NOTICE
   - 更新 NOTICE 文件以反映任何新增的第三方依赖

## 联系与问题

如有许可证相关问题，请联系：
- 邮箱：hi@awen.me

## 参考资源

- [Apache License 2.0 全文](https://www.apache.org/licenses/LICENSE-2.0)
- [Apache 许可证 FAQ](https://www.apache.org/foundation/license-faq.html)
- [Open Source Initiative - Apache-2.0](https://opensource.org/licenses/Apache-2.0)
