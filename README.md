# Bad Apple

使用 Node.js 在终端中播放 Bad Apple 的練習專案。

## 安裝

如果是 Ubuntu 系統，請先安裝 `libasound2-dev`：

```bash
sudo apt-get install libasound2-dev
```

然後加入以下聲音設定到 `~/.asoundrc`：

```bash
printf 'pcm.!default {\n    type pulse\n}\nctl.!default {\n    type pulse\n}\n' >> ~/.asoundrc
```

如果是 WSL 中還需要安裝 `libasound2-plugins`：

```bash
sudo apt-get install libasound2-plugins
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
