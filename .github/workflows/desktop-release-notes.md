## 下载 / Download

| 文件 File | 平台 Platform |
| --- | --- |
| `Synapse-0.1.0-arm64.dmg` | macOS（Apple Silicon） |
| `Synapse-0.1.0-x64.dmg` | macOS（Intel） |
| `Synapse-Setup-0.1.0-x64.exe` | Windows x64 |

## 安装说明 / Install notes

**未签名应用**（课程项目，无付费开发者账号，D6 决定）：

- **macOS**：打开 dmg，把 Synapse 拖进 Applications。**首次启动**请右键 App →「打开」→ 再点「打开」（或到 系统设置 → 隐私与安全性 → 点「仍要打开」）——只需一次。
- **Windows**：运行安装包；出现 SmartScreen 蓝色提示时点「更多信息」→「仍要运行」。

桌面版与网页版连接**同一个部署后端**（需联网），账号通用。应用 origin 为 `app://synapse`（后端 CORS 已包含该 origin）。
