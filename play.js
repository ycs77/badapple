import { Renderer } from './render.js'
import { FFmpegFrameLoader } from './loader.js'
import { AudioSyncPlayer } from './audio.js'

const width = 80
const height = 25
const fps = 24

// hide cursor
process.stdout.write('\x1B[?25l')

const frameLoader = new FFmpegFrameLoader('badapple.mp4', width, height, fps)
const audioPlayer = new AudioSyncPlayer('badapple.mp3')
const renderer = new Renderer(frameLoader, fps)

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
renderer.start(startTime)
