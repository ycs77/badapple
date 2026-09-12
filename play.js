import { Renderer } from './render.js'
import { FFmpegFrameLoader } from './ffmpeg.js'

const width = 80
const height = 25
const videoFps = 24

// hide cursor
process.stdout.write('\x1B[?25l')

const loader = new FFmpegFrameLoader('badapple.mp4', width, height, videoFps)
const renderer = new Renderer(loader, videoFps)

process.on('SIGINT', () => {
  renderer.clear()
  loader.clear()

  // show cursor
  process.stdout.write('\x1B[?25h')

  process.stdout.write('\n')

  process.exit(0)
})

loader.init()
renderer.init()
