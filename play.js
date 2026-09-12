import { Renderer } from './render.js'
import { FFmpegFrameLoader } from './loader.js'
import { AudioSyncPlayer } from './audio.js'

const originalWidth = 480
const originalHeight = 360
const originalRatio = originalWidth / originalHeight

const charRatio = 2.05 / 1
const terminalWidth = process.stdout.columns
const terminalHeight = process.stdout.rows
const terminalRatio = (terminalWidth / (terminalHeight * charRatio))

let renderedHeight = 1
let renderedWidth = 1

if (terminalRatio > originalRatio) {
  renderedHeight = terminalHeight
  renderedWidth = Math.round(originalWidth / (originalHeight / (renderedHeight * charRatio)))
} else {
  renderedWidth = terminalWidth
  renderedHeight = Math.round(originalHeight / (originalWidth / renderedWidth) / charRatio)
}

let offsetX = Math.floor((terminalWidth - renderedWidth) / 2)
let offsetY = Math.floor((terminalHeight - renderedHeight) / 2)

const fps = 24

// hide cursor
process.stdout.write('\x1B[?25l')

process.stdout.write('\x1B[2J\x1B[3J\x1B[H')

const frameLoader = new FFmpegFrameLoader('badapple.mp4', renderedWidth, renderedHeight, fps)
const audioPlayer = new AudioSyncPlayer('badapple.mp3')
const renderer = new Renderer(frameLoader, offsetX, offsetY, fps)

process.on('SIGINT', () => {
  renderer.clear()
  audioPlayer.clear()
  frameLoader.clear()

  // show cursor
  process.stdout.write('\x1B[?25h')

  process.stdout.write('\n')

  process.exit(0)
})

await audioPlayer.init()
renderer.init()
frameLoader.init()

await frameLoader.waitForFirstFrame()

const startTime = await audioPlayer.start()
renderer.onEnd(() => {
  audioPlayer.clear()
  frameLoader.clear()

  // show cursor
  process.stdout.write('\x1B[?25h')

  process.stdout.write('\n')
})
renderer.start(startTime)
