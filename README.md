# Bad Apple

使用 Node.js 在终端中播放 Bad Apple 的練習專案。

## 安裝

Windows 需要使用 Chocolatey 安裝 Python 與 Visual Studio 2026 的 C++ 工具：

```bash
choco install python visualstudio2026-workload-vctools -y
```

然後安裝所需的依賴：

```bash
npm install
```

## 使用方法

下載 Bad Apple 影片：

```bash
chmod +x fetch_video.sh
./fetch_video.sh
```

開始播放 Bad Apple：

```bash
node play.mjs
```
