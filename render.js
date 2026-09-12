export class Renderer {
  constructor(frameLoader, offsetX, offsetY, fps = 30) {
    this.frameLoader = frameLoader
    this.offsetX = offsetX
    this.offsetY = offsetY
    this.frameDuration = 1000 / fps
    this.frameBufferMap = new Map()
    this.startTime = null
    this.isRunning = false
    this.isWriting = false
    this.onEndCallback = null
  }

  init() {
    this.frameLoader.onFrameLoaded((frameBuffer, frame, width, height) => {
      let output = '\n'.repeat(this.offsetY)

      for (let y = 0; y < height; y++) {
        output += ' '.repeat(this.offsetX)
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x
          const pixelValue = frameBuffer[pixelIdx]
          output += pixelValue > 127 ? '@' : ' '
        }
        if (y < height - 1) {
          output += '\n'
        }
      }

      this.frameBufferMap.set(frame, output)
    })
  }

  start(startTime) {
    this.startTime = startTime
    this.isRunning = true
    this.tick()
  }

  tick() {
    if (!this.isRunning) {
      this.clear()
      if (this.onEndCallback) {
        this.onEndCallback()
      }
      return
    }

    if (this.isWriting) return

    this.renderFrame()

    if (!this.isRunning) {
      this.tick()
      return
    }

    if (this.isWriting) return

    const elapsed = performance.now() - this.startTime
    const targetFrame = Math.floor(elapsed / this.frameDuration) + 1
    const nextFrameTime = this.startTime + targetFrame * this.frameDuration
    const remainingTime = nextFrameTime - performance.now()
    setTimeout(this.tick.bind(this), Math.max(0, remainingTime))
  }

  renderFrame() {
    const elapsed = performance.now() - this.startTime
    const targetFrame = Math.floor(elapsed / this.frameDuration) + 1

    for (const frame of this.frameBufferMap.keys()) {
      if (frame < targetFrame) {
        this.frameBufferMap.delete(frame)
      }
    }

    const output = this.frameBufferMap.get(targetFrame)
    if (!output) {
      if (this.frameLoader.isComplete && targetFrame > this.frameLoader.frame) {
        this.isRunning = false
      }

      return
    }

    this.frameBufferMap.delete(targetFrame)

    if (!process.stdout.write('\x1B[H' + output)) {
      this.isWriting = true
      process.stdout.once('drain', () => {
        this.isWriting = false
        this.tick()
      })
    }
  }

  onEnd(callback) {
    this.onEndCallback = callback
  }

  clear() {
    this.isRunning = false
  }
}
