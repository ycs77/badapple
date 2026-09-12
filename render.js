export class Renderer {
  constructor(loader, fps = 30) {
    this.loader = loader
    this.fps = fps
    this.frameDuration = 1000 / fps
    this.frameBufferMap = new Map()
    this.isStarted = false
    this.isRunning = true
    this.nextFrameTime = performance.now()
    this.frameCount = 0
    // this.startRenderingTime = performance.now()
  }

  init() {
    this.loader.onFrameLoaded((frameBuffer, frame, width, height) => {
      let output = ''

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x
          const pixelValue = frameBuffer[pixelIdx]
          output += pixelValue > 127 ? '@' : ' '
        }
        output += '\n'
      }

      this.frameBufferMap.set(frame, output)
    })


    this.tick()
  }

  tick() {
    if (!this.isRunning) {
      // show cursor
      process.stdout.write('\x1B[?25h')
      return
    }

    const now = performance.now()

    // 1. 檢查是否到了該渲染的時間點
    if (now >= this.nextFrameTime) {
      this.renderFrame()

      // 核心：精確鎖定下一個影格的絕對時間，避免誤差累積
      this.nextFrameTime += this.frameDuration
    }

    // 2. 動態計算距離下一格還有多久
    const remainingTime = this.nextFrameTime - performance.now()

    if (remainingTime > 1) {
      // 如果時間還久（大於 1ms），讓出 CPU 休息，避免 CPU 100%
      setTimeout(this.tick.bind(this), remainingTime - 1)
    } else {
      // 如果快到了（小於 1ms），用 setImmediate 在下一個 Event Loop 密集檢查，確保精準度
      setImmediate(this.tick.bind(this))
    }
  }

  renderFrame() {
    if (!this.isStarted) {
      if (this.frameBufferMap.size > 0) {
        this.isStarted = true
      }

      return
    }

    this.frameCount++

    const output = this.frameBufferMap.get(this.frameCount)
    this.frameBufferMap.delete(this.frameCount)
    if (this.frameBufferMap.size === 0) {
      this.isRunning = false
    }

    process.stdin.write('\x1B[2J\x1B[3J\x1B[H' + output)

    // const renderingTime = now - this.startRenderingTime
    // process.stdin.write(`影格時間：${this.formatTime(frameCount / fps)} (frame: ${this.frameCount})\n實際時間：${this.formatTime(renderingTime / 1000)} (frame: ${Math.floor(renderingTime / 1000 * this.fps)})\n`)
  }

  // formatTime(seconds) {
  //   const date = new Date(seconds * 1000)
  //   return date.toISOString().substr(11, 8)
  // }

  clear() {
    this.isRunning = false
  }
}
