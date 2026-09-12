export class Renderer {
  constructor(frameLoader, fps = 30) {
    this.frameLoader = frameLoader
    this.fps = fps
    this.frameDuration = 1000 / fps
    this.frameBufferMap = new Map()
    this.startTime = null
    this.isRunning = false
    this.isWriting = false
  }

  init() {
    this.frameLoader.onFrameLoaded((frameBuffer, frame, width, height) => {
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
  }

  start(startTime) {
    this.startTime = startTime
    this.isRunning = true
    this.tick()
  }

  tick() {
    if (!this.isRunning) {
      process.stdout.write('\x1B[?25h')
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

  clear() {
    this.isRunning = false
  }
}
