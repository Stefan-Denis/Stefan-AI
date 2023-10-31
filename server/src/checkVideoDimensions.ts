import path from 'path'
import fs from 'fs-extra'
import { spawn } from 'child_process'

// __dirname
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

const ffprobe = path.join(__dirname, '../', 'modules', 'ffprobe.exe')

export default async function checkVideoDimensions(file: Express.Multer.File): Promise<boolean> {
    const videoPath = path.join(__dirname, '../', 'videos', file.originalname)
    console.log(`Checking dimensions of ${videoPath}...`)
    const ffprobeProcess = spawn(ffprobe, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', videoPath])
    const stdoutChunks: Array<Buffer> = []
    ffprobeProcess.stdout.on('data', (chunk) => {
        stdoutChunks.push(chunk)
    })
    await new Promise((resolve) => {
        ffprobeProcess.on('close', resolve)
    })
    const stdout = Buffer.concat(stdoutChunks).toString()
    console.log(`Output of ffprobe for ${videoPath}: ${stdout}`)
    const { streams } = JSON.parse(stdout)
    const videoStream = streams.find((stream: any) => stream.width === 1080 && stream.height === 1920)
    if (!videoStream) {
        console.log(`${videoPath} is not 1080x1920. Deleting...`)
        await fs.unlink(videoPath)
        return false
    } else {
        console.log(`${videoPath} is 1080x1920. Keeping...`)
        return true
    }
}