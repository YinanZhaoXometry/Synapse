## 下载 / Download

| 文件 File | 平台 Platform |
| --- | --- |
| `Synapse-<version>-arm64.dmg` | macOS（Apple Silicon） |
| `Synapse-<version>-x64.dmg` | macOS（Intel） |
| `Synapse-Setup-<version>-x64.exe` | Windows x64 |

（版本号以本 release 标签与资产文件名为准。）

## 安装说明 / Install notes

**未签名、未公证**（课程项目，无 Apple 开发者账号 / Windows 代码签名证书）——各平台首次启动需要一次手动放行：

- **macOS**：打开 dmg，把 Synapse 拖进 Applications，然后在**终端**跑一条命令解除 Gatekeeper 隔离标记（新版 macOS 对未公证 app 会报「已损坏，应移到废纸篓」——那是隔离标记，不是真损坏）：

  ```bash
  xattr -dr com.apple.quarantine /Applications/Synapse.app
  ```
  （系统设置 → 隐私与安全性 → 「仍要打开」在新版 macOS 上经常不出现，以这条命令为准；只需一次。）
- **Windows**：运行安装包；出现 SmartScreen 蓝色提示时点「更多信息」→「仍要运行」。

桌面版与网页版连接**同一个部署后端**（需联网），账号通用。应用 origin 为 `app://synapse`（后端 CORS 已包含该 origin）。
