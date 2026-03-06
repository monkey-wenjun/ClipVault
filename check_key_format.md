# TAURI_PRIVATE_KEY 格式检查

## ❌ 错误的格式（不要这样填）
只填 base64 字符串，没有头部：
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHByaXZhdGUga2V5OiA1MUU3RTcxNjY3NjY3RUNBClJXV0RYM0lmV3RaWWtDZ2d...（省略）
```

## ✅ 正确的格式（必须这样填）
包含完整的头部和换行：
```
untrusted comment: minisign encrypted secret key
RWRTY0Iy+NmPwGca4M3qG9b41iTV41Df39DZ5WFG1U5wBveNqcqf7bqf...
```

## 如何正确获取私钥内容：

1. 找到生成的私钥文件（通常是 `minisign.key`）

2. 使用文本编辑器打开，完整复制全部内容，包括第一行的 `untrusted comment:`

3. 或者使用命令行查看：
   ```bash
   cat minisign.key
   # 或者
   type minisign.key
   ```

4. 复制输出的**全部内容**到 GitHub Secrets

## 如果私钥有密码保护

需要在 Secrets 中添加：
- `TAURI_KEY_PASSWORD` = 你的密码

如果**没有**密码保护，`TAURI_KEY_PASSWORD` 可以留空或不设置
