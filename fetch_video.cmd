@echo off
chcp 65001 > nul

yt-dlp ^
  --output "badapple.%%(ext)s" ^
  --merge-output-format mp4 ^
  "https://www.youtube.com/watch?v=FtutLA63Cp8"

ffmpeg -i badapple.mp4 -map 0:a -c:a libmp3lame -q:a 2 badapple.mp3

pause
