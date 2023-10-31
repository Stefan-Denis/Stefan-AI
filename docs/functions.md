# getUsageLimit()

It retrieves the usage limit per video saved in settings.json
it can return the value to a variable as a number

```typescript
export default function getUsageLimit() {
    const settingsFilePath = path.join(__dirname, '../', 'config', 'settings.json')
    const settingsFileData: settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'))
    return settingsFileData.videoUsageCap
}
```

# setUsageLimit()

setUsageLimit takes a parameter of a number to set the usage limit per video.

```typescript
export default function setUsageLimit(usageLimit: number) {
    const settingsFilePath = path.join(__dirname, '../', 'config', 'settings.json')
    const settingsFileData: settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'))
    settingsFileData.videoUsageCap = usageLimit
    fs.writeFileSync(settingsFilePath, JSON.stringify(settingsFileData, null, 4))
}
```

# checkVideoDimensions()

This function checks the dimensions of a video if they are 1080x1920

```ts
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
```
