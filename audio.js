import fs from 'fs'
import Speaker from 'speaker'
import audioDecode from 'audio-decode'

export class AudioSyncPlayer {
  constructor(audioPath, fps = 30) {
    this.audioPath = audioPath
    this.fps = fps
    this.pcmBuffer = null
    this.bytesPerFrame = 0
    this.speaker = null
  }

  // 初始化：載入、解碼並設定喇叭
  async init() {
    const fileBuffer = fs.readFileSync(this.audioPath)
    const { channelData, sampleRate } = await audioDecode(fileBuffer)

    const channels = channelData.length
    const audioLength = channelData[0].length // 取得單一聲道長度

    // 將 Float32 轉成 16-bit PCM Buffer
    this.pcmBuffer = Buffer.alloc(audioLength * channels * 2)
    let offset = 0

    for (let i = 0; i < audioLength; i++) {
      for (let c = 0; c < channels; c++) {
        let sample = channelData[c][i]
        sample = Math.max(-1, Math.min(1, sample))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        this.pcmBuffer.writeInt16LE(intSample, offset)
        offset += 2
      }
    }

    // 計算每一格畫面（Frame）對應多少 Byte 的音訊資料
    const bytesPerSecond = sampleRate * channels * 2
    this.bytesPerFrame = Math.floor(bytesPerSecond / this.fps)

    // 啟動喇叭
    this.speaker = new Speaker({ channels, bitDepth: 16, sampleRate })
  }

  playFrame(frameCount) {
    if (!this.pcmBuffer || !this.speaker) return

    const startByte = (frameCount - 1) * this.bytesPerFrame
    const endByte = startByte + this.bytesPerFrame

    if (startByte >= this.pcmBuffer.length) return

    // 切出這一格的聲音碎片並寫入喇叭
    const audioChunk = this.pcmBuffer.subarray(startByte, Math.min(endByte, this.pcmBuffer.length))
    this.speaker.write(audioChunk)
  }

  clear() {
    if (this.speaker) {
      this.speaker.end()
      this.speaker = null
    }
  }
}
