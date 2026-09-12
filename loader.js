import { spawn } from 'node:child_process'

export class FFmpegFrameLoader {
  constructor(videoPath, width, height, fps = 30) {
    this.videoPath = videoPath
    this.width = width
    this.height = height
    this.frameSize = width * height
    this.fps = fps
    this.frameLoadedCallback = null
    this.process = null
    this.bufferArray = []
    this.totalLength = 0
    this.frame = 0
    this.isComplete = false
    this.firstFramePromise = null
    this.resolveFirstFrame = null
    this.rejectFirstFrame = null
  }

  waitForFirstFrame() {
    if (!this.firstFramePromise) {
      throw new Error('FFmpegFrameLoader 必須先完成初始化才能等待影格')
    }

    return this.firstFramePromise
  }

  init() {
    this.firstFramePromise = new Promise((resolve, reject) => {
      this.resolveFirstFrame = resolve
      this.rejectFirstFrame = reject
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
        this.resolveFirstFrame?.()
        this.resolveFirstFrame = null
        this.rejectFirstFrame = null
      }
    })

    this.process.stderr.on('data', (data) => {
      console.error(`FFMpeg 錯誤: ${data}`)
    })

    this.process.once('error', error => {
      this.rejectFirstFrame?.(error)
      this.rejectFirstFrame = null
    })

    this.process.on('close', () => {
      this.isComplete = true

      if (this.rejectFirstFrame) {
        this.rejectFirstFrame(new Error('FFmpeg 未產生任何影格'))
        this.rejectFirstFrame = null
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
