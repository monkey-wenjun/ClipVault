# Apache-2.0 合规性总结

## 项目信息

- **项目名称**: ClipVault
- **基础项目**: EcoPaste (https://github.com/EcoPasteHub/EcoPaste)
- **许可证**: Apache-2.0
- **衍生类型**: Fork/修改版本

## 合规状态

### ✅ 已完成的合规要求

1. **保留版权声明**
   - README.md 中明确声明基于 EcoPaste
   - NOTICE 文件列出第三方软件
   - LICENSE 文件完整保留

2. **提供许可证副本**
   - 项目根目录包含完整的 Apache-2.0 LICENSE 文件
   - README.md 中包含许可证徽章和链接

3. **说明修改内容**
   - README.md 说明这是 EcoPaste 的衍生作品
   - LICENSE_COMPLIANCE.md 记录所有重大修改
   - 版本变更日志完整

4. **独立品牌**
   - 使用 ClipVault 作为新名称
   - 使用新的应用图标
   - 避免与原项目混淆

5. **第三方声明**
   - NOTICE 文件包含所有第三方软件声明
   - 致谢部分感谢原始项目

### 📋 需要持续维护的项目

1. **源代码中的版权声明**
   - 修改 EcoPaste 的源文件时，保留原始版权声明
   - 在文件头添加修改声明

2. **分发时包含必要文件**
   - LICENSE
   - NOTICE
   - README.md

3. **定期更新**
   - 记录所有重大修改
   - 更新 NOTICE 文件中的第三方依赖

## 已创建/修改的文件

| 文件 | 说明 |
|------|------|
| `LICENSE` | Apache-2.0 许可证全文（已存在） |
| `NOTICE` | 版权声明和第三方软件声明（新增） |
| `README.md` | 重写，添加必要的归属声明（已更新） |
| `LICENSE_COMPLIANCE.md` | 合规指南（新增） |
| `COMPLIANCE_SUMMARY.md` | 本文件，合规总结（新增） |

## 推荐的最佳实践

1. **透明度优先**
   - 始终明确说明项目的来源
   - 不要试图隐藏与 EcoPaste 的关系

2. **贡献回馈**
   - 考虑将通用改进提交回 EcoPaste 项目
   - 参与开源社区建设

3. **定期审查**
   - 每次发布前检查 LICENSE 和 NOTICE 文件
   - 确保所有新依赖的许可证兼容

4. **法律咨询**
   - 如有重大商业使用计划，建议咨询专业法律顾问
   - 特别是涉及专利相关的内容

## 关于 Apache-2.0 的常见问题

### Q: 我可以将 ClipVault 商业化吗？
**A:** 可以。Apache-2.0 允许商业使用，但必须遵守许可证要求。

### Q: 我需要开源我的修改吗？
**A:** 如果你分发修改后的版本，必须提供源代码。如果是内部使用则不需要。

### Q: 我可以在应用中使用 EcoPaste 的名称吗？
**A:** 不建议。Apache-2.0 不授予商标使用权。请使用 ClipVault 作为独立品牌。

### Q: 如果我发现了 bug，需要报告给 EcoPaste 吗？
**A:** 不是必须的，但这是良好的开源社区实践。

## 联系信息

如有合规相关问题：
- 邮箱：hi@awen.me

## 参考链接

- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [Apache 许可证 FAQ](https://www.apache.org/foundation/license-faq.html)
- [EcoPaste 项目](https://github.com/EcoPasteHub/EcoPaste)
