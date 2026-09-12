import { spawn } from 'child_process'

const width = 80
const height = 25
const frameSize = width * height

const fps = 24
const frameDuration = 1000 / fps

// hide cursor
process.stdout.write('\x1B[?25l')

let bufferArray = []
let totalLength = 0
let bufferFrame = 0
const frameBufferMap = new Map()

const ffmpeg = spawn('ffmpeg', [
  // '-ss', '00:00:00',
  // '-to', '00:00:10',
  '-i', 'badapple.mp4',
  '-vf', `fps=${fps},scale=${width}:${height},format=gray,geq=lum=\'gt(p(X,Y),127)*255\'`,
  '-f', 'rawvideo',
  // '-vframes', '1',
  '-pix_fmt', 'gray',
  '-v', 'quiet',
  '-',
])

ffmpeg.stdout.on('data', chunk => {
  bufferArray.push(chunk)
  totalLength += chunk.length

  while (totalLength >= frameSize) {
    const totalBuffer = Buffer.concat(bufferArray, totalLength)
    const frameBuffer = totalBuffer.subarray(0, frameSize)
    bufferArray = [totalBuffer.subarray(frameSize)]
    totalLength -= frameSize
    bufferFrame++

    let output = ''
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIdx = y * width + x
        const luminance = frameBuffer[pixelIdx]
        output += luminance > 127 ? '@' : ' '
      }
      output += '\n'
    }
    frameBufferMap.set(bufferFrame, output)
  }
})

ffmpeg.stderr.on('data', (data) => {
  console.error(`FFMpeg 錯誤: ${data}`)
})

ffmpeg.on('close', () => {})

let isStarted = false
let isRunning = true
let nextFrameTime = performance.now()
let frameCount = 0

// let startRenderingTime = performance.now()

function tick() {
  if (!isRunning) {
    // show cursor
    process.stdout.write('\x1B[?25h')
    return
  }

  const now = performance.now()

  // 1. 檢查是否到了該渲染的時間點
  if (now >= nextFrameTime) {
    renderFrame(now)

    // 核心：精確鎖定下一個影格的絕對時間，避免誤差累積
    nextFrameTime += frameDuration
  }

  // 2. 動態計算距離下一格還有多久
  const remainingTime = nextFrameTime - performance.now()

  if (remainingTime > 1) {
    // 如果時間還久（大於 1ms），讓出 CPU 休息，避免 CPU 100%
    setTimeout(tick, remainingTime - 1)
  } else {
    // 如果快到了（小於 1ms），用 setImmediate 在下一個 Event Loop 密集檢查，確保精準度
    setImmediate(tick)
  }
}

function renderFrame(now) {
  if (!isStarted) {
    if (frameBufferMap.size > 0) {
      isStarted = true
    }
    return
  }

  frameCount++

  const output = frameBufferMap.get(frameCount)
  frameBufferMap.delete(frameCount)
  if (frameBufferMap.size === 0) {
    isRunning = false
  }

  process.stdin.write('\x1B[2J\x1B[3J\x1B[H' + output)

  // const renderingTime = now - startRenderingTime
  // process.stdin.write(`影格時間：${formatTime(frameCount / fps)} (frame: ${frameCount})\n實際時間：${formatTime(renderingTime / 1000)} (frame: ${Math.floor(renderingTime / 1000 * fps)})\n`)
}

// function formatTime(seconds) {
//   const date = new Date(seconds * 1000)
//   return date.toISOString().substr(11, 8)
// }

tick()

process.on('SIGINT', () => {
  isRunning = false

  ffmpeg.kill()

  // show cursor
  process.stdout.write('\x1B[?25h')

  process.stdout.write('\n')

  process.exit(0)
})
