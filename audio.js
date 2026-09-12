import fs from 'node:fs'
import { Readable } from 'node:stream'
import Speaker from 'speaker'
import audioDecode from 'audio-decode'

export class AudioSyncPlayer {
  constructor(audioPath) {
    this.audioPath = audioPath
    this.pcmBuffer = null
    this.speaker = null
    this.pcmStream = null
  }

  // 初始化：載入、解碼並設定喇叭
  async init() {
    const fileBuffer = fs.readFileSync(this.audioPath)
    const { channelData, sampleRate } = await audioDecode(fileBuffer)

    const channels = channelData.length
    const audioLength = channelData[0].length // 取得單一聲道長度
    const blockAlign = channels * 2

    // 將 Float32 轉成 16-bit PCM Buffer
    this.pcmBuffer = Buffer.allocUnsafe(audioLength * blockAlign)
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

    this.speaker = new Speaker({ channels, bitDepth: 16, sampleRate })
  }

  start() {
    if (!this.pcmBuffer || !this.speaker) {
      throw new Error('AudioSyncPlayer 必須先完成初始化才能開始播放')
    }

    this.pcmStream = Readable.from([this.pcmBuffer])

    return new Promise((resolve, reject) => {
      this.speaker.once('open', () => resolve(performance.now()))
      this.speaker.once('error', reject)
      this.pcmStream.pipe(this.speaker)
    })
  }

  clear() {
    this.pcmStream?.destroy()

    if (this.speaker) {
      this.speaker.end()
      this.speaker = null
    }
  }
}
