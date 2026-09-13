import { spawn } from 'node:child_process'

export class FFmpegFrameLoader {
  constructor(videoPath, width, height, fps = 30, bufferFrames = 1) {
    this.videoPath = videoPath
    this.width = width
    this.height = height
    this.frameSize = width * height
    this.fps = fps
    this.bufferFrames = bufferFrames
    this.frameLoadedCallback = null
    this.process = null
    this.bufferArray = []
    this.totalLength = 0
    this.frame = 0
    this.isComplete = false
    this.bufferReadyPromise = null
    this.resolveBufferReady = null
    this.rejectBufferReady = null
  }

  waitForBuffer() {
    if (!this.bufferReadyPromise) {
      throw new Error('FFmpegFrameLoader 必須先完成初始化才能等待影格')
    }

    return this.bufferReadyPromise
  }

  init() {
    this.bufferReadyPromise = new Promise((resolve, reject) => {
      this.resolveBufferReady = resolve
      this.rejectBufferReady = reject
    })

    this.process = spawn('ffmpeg', [
      // '-ss', '00:00:00',
      // '-to', '00:00:10',
      '-i', this.videoPath,
      '-vf', `fps=${this.fps},scale=${this.width}:${this.height},format=gray,geq=lum=\'gt(p(X,Y),127)*255\'`,
      '-f', 'rawvideo',
      // '-vframes', '1',
      '-pix_fmt', 'gray',
      '-v', 'quiet',
      '-',
    ])

    this.process.stdout.on('data', chunk => {
      this.bufferArray.push(chunk)
      this.totalLength += chunk.length

      while (this.totalLength >= this.frameSize) {
        const totalBuffer = Buffer.concat(this.bufferArray, this.totalLength)
        const frameBuffer = totalBuffer.subarray(0, this.frameSize)
        this.bufferArray = [totalBuffer.subarray(this.frameSize)]
        this.totalLength -= this.frameSize
        this.frame++

        if (this.frameLoadedCallback) {
          this.frameLoadedCallback(frameBuffer, this.frame, this.width, this.height)
        }
        if (this.frame >= this.bufferFrames) {
          this.resolveBufferReady?.()
          this.resolveBufferReady = null
          this.rejectBufferReady = null
        }
      }
    })

    this.process.stderr.on('data', (data) => {
      console.error(`FFMpeg 錯誤: ${data}`)
    })

    this.process.once('error', error => {
      this.rejectBufferReady?.(error)
      this.rejectBufferReady = null
    })

    this.process.on('close', () => {
      this.isComplete = true

      if (this.rejectBufferReady) {
        this.rejectBufferReady(new Error(`FFmpeg 在載入 ${this.bufferFrames} 個影格前結束`))
        this.rejectBufferReady = null
      }

    })
  }

  onFrameLoaded(callback) {
    this.frameLoadedCallback = callback
  }


  clear() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }
}
