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

# notExists()

Checks if a file does not exist.

```typescript
/**
 * Checks if a file does not exist.
 * @param file - The path to the file to check.
 * @type {string}
 * @returns A boolean indicating whether the file does not exist.
 */
function notExists(file: string) {
    return !fs.existsSync(file)
}
```

# crashHandler()

Handles the crash state of the application by writing a boolean value to a file.

```ts
// App crash handler
/**
 * Handles the crash state of the application by writing a boolean value to a file.
 * @param state The state of the application, either 'crash' or 'no-crash'.
 */
function crashHandler(state: string) {
    if (state === 'crash') {
        fs.writeFileSync(crashFile, 'true')
    } else if (state === 'no-crash') {
        fs.writeFileSync(crashFile, 'false')
    }
}
```

# generateCombinations()

Generates the combinations for the videos.

returns its own propietary type

```ts
type videoDataMatrix = Array<Array<string | number>>
```

```ts
/**
 * Generates the combinations for the videos.
 * @returns An array of combinations.
 */
type videoDataMatrix = Array<Array<string | number>>
function generateCombinations(): combination {
    const matrix: videoDataMatrix = []
    const combinations: combination = []
    const maxUsage = app.settings.easy.maxVideoUsage
    const videosPerCombination = app.settings.easy.videosPerCombination

    // Initialize the matrix
    files.forEach(file => {
        matrix.push([file, 0])
    })

    // Generate combinations
    for (let i = 0; i < matrix.length; i++) {
        const combination: string[] = []
        let j = i
        while (combination.length < videosPerCombination && j < matrix.length) {
            // Check if video has not been used more than maxUsage times
            if ((matrix[j][1] as number) < maxUsage) {
                combination.push(matrix[j][0] as string)
                matrix[j][1] = (matrix[j][1] as number) + 1
            }
            j++
        }
        if (combination.length === videosPerCombination) {
            combinations.push(combination)
        }
    }

    /**
     * False is added to keep track which combinations have been made.
     * The first false array is the last one processed
     */
    combinations.forEach(combination => {
        combination.push(false)
    })

    // Shuffle the cominations if app.settings.easy.shuffle === true
    if (app.settings.easy.shuffle) {
        for (let i = combinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combinations[i], combinations[j]] = [combinations[j], combinations[i]]
        }
    }

    return combinations
}
```

# constructPrompt()

Creates the prompt for GPT based on the user settings

```ts
/**
 * @param type can recieve `system` or `user` as a string.
 * @param currentCombination `(optional)` can recieve The current combination of videos.
 * @returns The Prompt
 */
async function constructPrompt(type: string, currentCombination?: subCombination): Promise<string> {
    let prompt = ''

    if (type === 'system') {
        prompt =
            `You are an AI assistant for Stefan-AI, an app that uses a powerful settings file and inputted videos to create short form content for TikTok and YouTube Shorts.
            Your task is to process the given video data and generate a JSON output that determines which videos should be used in the content creation process, and provide a message for each video.
            You have the following features at your disposal: Dynamic Video Selection, Min, Max & Preferred Length, Rules, Desired Output, General Theme, Video Themes.
            Based on these features, generate a JSON output in the following format: {\"video1\": {\"isUsed\": true, \"message\": \"insert message here\"}, \"video2\": {\"isUsed\": true, \"message\": \"insert message here\"}, \"video3\": {\"isUsed\": true, \"message\": \"insert message here\"}}.
            Remember, the number of objects in the output should match the number of videos provided in the prompt, also, if its convenient, you can make it so that the message splits on multiple videos, just add a property to the JSON named "extends" and set it to true if thats the case.`
    }

    else if (type === 'user') {
        if (!currentCombination) {
            console.error('currentCombination is undefined for user prompt')
            process.exit(1)
        }

        // Determine video Themes
        const videoThemesPath = path.join(__dirname, '../', 'config', 'theme.json')
        const videoThemes = JSON.parse(fs.readFileSync(videoThemesPath, 'utf-8'))

        const videoDirPath = path.join(__dirname, '../', 'videos')
        const amountOfVideos = fs.readdirSync(videoDirPath).filter(file => path.extname(file) === '.mp4').length

        const videoCombination: Record<string, { theme: string }> = {}

        for (let i = 1; i <= app.settings.easy.videosPerCombination; i++) {
            videoCombination[`video${i}`] = {
                theme: "",
            }
        }

        for (const key in videoCombination) {
            for (let x = 0; x < amountOfVideos; x++) {
                const video = currentCombination[parseInt(key.replace('video', '')) - 1] as string
                if (video === videoThemes[x][0]) {
                    videoCombination[key].theme = videoThemes[x][1]
                }
            }
        }

        let arrayOfThemes: Array<string> = []
        for (const key in videoCombination) {
            arrayOfThemes.push(videoCombination[key].theme)
        }
        prompt =
            `I will need you to make a video script for the following videos:
            ${arrayOfThemes.map((theme, index) => `${index + 1}. ${theme}`).join('\n')}

            The general theme the videos need to respect:
            ${app.settings.advanced.generalTheme}

            Dynamic Video Selection: ${app.settings.easy.dynamicVideoSelection ? 'Enabled' : 'Disabled'}
            Desired Output: ${app.settings.advanced.desiredOutput}

            Information regarding how long you need to make the script in total:
            - Minimum length: ${app.settings.easy.length.min} seconds
            - Maximum length: ${app.settings.easy.length.max} seconds
            - Preferred length: ${app.settings.easy.length.preferred} seconds
            ! Current Voice Speaking Rate: 180 Words per Minute
            * Make sure to calculate how many words you can fit into each subtitle. Try to reach the limit
            * The time limit is for all clips length combined with their messages.

            Here are the rules you need to follow:
            ${app.promptRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}
            Please process the videos.
            `
    }

    return prompt
}
```

# subtitles()

Generates the subtitles for the video

```ts
async function subtitles() {
    if ((test.enabled && test.unitToTest === 'prompt') || !test.enabled) {
        /**
         * Interface representing a system and user prompt.
         */
        interface prompts extends Object {
            system: string
            user: string
        }

        /**
         * The prompts for the AI.
         * @type {prompts}
         * @property {string} system - The system prompt.
         * @property {string} user - The user prompt.
         */
        const prompts: prompts = {
            system: (await constructPrompt('system')).trimStart(),
            user: (await constructPrompt('user', currentCombination)).trimStart()
        }

        /**
         * The OpenAI Class.
         */
        const openai = new OpenAI({
            apiKey: process.env.GPT_KEY
        })

        spinner = ora('Generating video script').start()

        if (!test.skipGPT || !test.enabled) {
            try {
                let videoScript: ChatCompletion | string = await openai.chat.completions.create({
                    messages: [
                        { "role": "system", "content": prompts.system },
                        { "role": "user", "content": prompts.user }
                    ],
                    model: 'ft:gpt-3.5-turbo-0613:tefan::8HXeI0yK',
                    temperature: 1,
                    max_tokens: 256
                })

                videoScript = videoScript.choices[0].message.content as unknown as string
                fs.writeFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), videoScript)

                spinner.succeed('Generated video script and written to file.')
            }

            catch (error) {
                spinner.fail('Failed to generate video script.')

                /**
                 * Restart
                 */
                setTimeout(async () => {
                    await subtitles()
                }, 1500)
            }
        }

        // Perform checks on the script
        spinner = ora('Performing checks on the script \n').start()

        interface Video {
            isUsed?: boolean
            extends?: boolean
            message?: string
        }

        interface StefanAIVideoScript {
            error?: string
            [key: string]: Video | string | undefined
        }


        // Validate if its correct JSON
        try {
            JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))
        } catch {
            spinner.clear()
            console.log(chalk.redBright('Error: ') + 'Improper JSON formatting, restart the app.')

            /**
             * Restart
             */
            setTimeout(async () => {
                await subtitles()
            }, 1500)
        }

        // Due to it working, it will declare videoScript
        const videoScript: StefanAIVideoScript = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))

        // Check if the script has an error
        if (videoScript.error) {
            spinner.clear()
            console.log('\n' + chalk.redBright('Error: ') + '\n' + videoScript.error + '\n')
            /**
             * Restart
             */
            setTimeout(async () => {
                await subtitles()
            }, 1500)
        }

        // Check if AI set all the videos to not be used
        let allNotUsed = true
        for (let key in videoScript) {
            let video = videoScript[key]
            if (typeof video !== 'string' && video?.isUsed) {
                allNotUsed = false
                break
            }
        }

        // If all videos are not used, set them all to be used
        if (allNotUsed) {
            for (let key in videoScript) {
                let video = videoScript[key]
                if (typeof video !== 'string' && video?.isUsed !== undefined) {
                    video.isUsed = true
                }
            }
        }

        spinner.clear()
    }
}
```


# SSMLParser()

Parses the SSML and returns the parsed SSML to a file.

```ts
        async function SSMLParser() {
            if ((test.enabled && test.unitToTest === 'SSMLParser') || !test.enabled) {
                spinner = ora('Parsing SSML').start()
                await wait(1200)

                let matrix: Array<Array<string | boolean>> = []

                const ssmlFilePath = path.join(__dirname, '../', 'temporary', 'propietary', 'subtitles.ssml')
                const videoScriptJSON: StefanAIVideoScript = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))

                for (const key in videoScriptJSON) {
                    const video = videoScriptJSON[key]
                    if (typeof video !== 'string' && video?.isUsed) {
                        matrix.push([video.message as string])
                    }

                    if (typeof video !== 'string' && video?.extends) {
                        matrix[matrix.length - 1].push(true)
                    }
                }

                let SSML = '<speak>\n'

                try {
                    for (let x = 0; x < matrix.length; x++) {
                        let subtitle = (matrix[x][0] as string).replace(/,/g, ',<break time="0.4s"/>')
                        subtitle = subtitle.replace(/\bif\b/gi, '<emphasis level="strong">if</emphasis>')
                        SSML += `<p><s>${subtitle}</s></p>\n`
                        if (matrix[x][1]) {
                            SSML += '<break time="0.17s"/>\n'
                        } else if (x === matrix.length - 1) {

                        } else {
                            SSML += '<break time="0.5s"/>\n'
                        }
                    }
                } finally {
                    SSML += '</speak>'
                }

                fs.writeFileSync(ssmlFilePath, SSML)
                spinner.succeed('Parsed SSML.')
            }
        }
```


# TTS()

Creates .mp4 file with the TTS output

```ts
        /**
         * The voice to use for the TTS.
         */
        const voice: string = Math.random() > 0.5 ? "en-US-Neural2-D" : "en-US-Neural2-J"
        async function TTS() {
            if ((test.enabled && test.unitToTest === 'TTS') || !test.enabled) {
                fs.emptydirSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio'))

                // Concatenate the files depending on the settings
                spinner = ora('Creating TTS file').start()

                const SSMLContents = fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'subtitles.ssml'), 'utf-8')
                await createTTS(SSMLContents, 'audio', voice, true)

                spinner.succeed('Created TTS file')
            }
        }
```


# getVideoLengths()

Returns the lengths of all the subtitles and determines how long each video should be

```ts
        async function getVideoLengths(): Promise<Array<number>> {
            const subtitlesLength: Array<number> = []

            if ((test.enabled && test.unitToTest === 'trimVideos') || !test.enabled) {
                spinner = ora('Retrieving Video Lengths').start()


                // Get the length of each subtitle
                async function testLength(videonr: number) {
                    let SSML: string = '<speak>\n'

                    // Parse to SSMl
                    try {
                        let subtitle = ((videoScriptJSON[`video${videonr}`] as Video)!.message as string).replace(/,/g, ',<break time="0.4s"/>')
                        subtitle = subtitle.replace(/\bif\b/gi, '<emphasis level="strong">if</emphasis>')

                        SSML += `<p><s>${subtitle}</s></p>\n`

                        if ((videoScriptJSON[`video${videonr}`] as Video)!.extends) {
                            SSML += '<break time="0.17s"/>\n'
                        } else {
                            SSML += '<break time="0.5s"/>\n'
                        }
                    } finally {
                        SSML += '</speak>'
                    }

                    await createTTS(SSML, 'temp', voice, true)

                    // Get the length of the audio file
                    const tempAudioFilePath = path.join(__dirname, '../', 'temporary', 'editing', 'audio', `temp.mp3`)
                    const ffprobe = spawnSync(path.join(__dirname, '../', 'modules', 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', tempAudioFilePath])
                    subtitlesLength.push(parseFloat(Number(ffprobe.stdout.toString()).toFixed(3)))
                }

                const videoScriptJSON: StefanAIVideoScript = await JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))

                const keys = Object.keys(videoScriptJSON)
                for (const key of keys) {
                    const videoNumber = parseInt(key.replace('video', ''))
                    await testLength(videoNumber)
                }

                spinner.succeed('Got video durations')
            }

            return subtitlesLength as Array<number>
        }
```


# trimVideos()

This functions trims the videos to the correct length:

```ts
        async function trimVideos(durations: Array<number>) {
            if ((test.enabled && test.unitToTest === 'trimVideos') || !test.enabled) {
                try {
                    const trimDir = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'trim')
                    fs.emptyDirSync(trimDir)

                    for (let index = 0; index < durations.length; index++) {
                        spinner = ora('Trimming video ' + (index + 1)).start()

                        const currentClip = currentCombination[index] as string
                        const videoPath = path.join(__dirname, '../', 'videos', currentClip)

                        const video = ffmpeg(videoPath)
                        video.noAudio()

                        if (index === 0 && app.settings.easy.loop) {
                            // Create the first clip 1 second shorter from the start
                            video.setStartTime(1)
                            video.setDuration(durations[index] - 1)
                            video.output(path.join(trimDir, `${index + 1}.mp4`))

                            // Create a new clip named loop.mp4 that is the first second of the first video
                            const loopVideo = ffmpeg(videoPath)
                            loopVideo.setStartTime(0)
                            loopVideo.setDuration(1)
                            loopVideo.output(path.join(trimDir, 'loop.mp4'))
                            await new Promise((resolve, reject) => {
                                loopVideo.on('error', (error) => {
                                    console.log(error)
                                    reject(error)
                                })

                                loopVideo.on('end', () => {
                                    spinner.succeed('Created loop.mp4')
                                    resolve(true)
                                })

                                loopVideo.run()
                            })
                        } else {
                            video.setStartTime(0)
                            video.setDuration(durations[index])
                            video.output(path.join(trimDir, `${index + 1}.mp4`))
                        }

                        await new Promise((resolve, reject) => {
                            video.on('error', (error) => {
                                console.log(error)
                                reject(error)
                            })

                            video.on('end', () => {
                                spinner.succeed('Trimmed video ' + (index + 1))
                                resolve(true)
                            })

                            video.run()
                        })
                    }
                } catch {
                    spinner.fail('Failed to trim videos')
                }
            }
        }
```


# concatVideos()

Concats all the videos together

```ts
        async function concatVideos() {
            if ((test.enabled && test.unitToTest === 'concat') || !test.enabled) {
                const trimDir = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'trim')
                const concatDir = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'concat')
                let files = fs.readdirSync(trimDir).filter(file => path.extname(file) === '.mp4' && path.basename(file, '.mp4') !== 'loop') as Array<string>
                fs.emptyDirSync(concatDir)

                spinner = ora('Concatenating videos ').start()

                // If the loop setting is enabled, add the loop video to the end of the files array
                if (app.settings.easy.loop) {
                    files.push('loop.mp4')
                }

                // Concatenate the videos 
                const outputPath = path.join(concatDir, 'output.mp4')
                try {
                    await concat({
                        output: outputPath,
                        videos: files.map(file => path.join(trimDir, file)),
                        transition: app.settings.advanced.transitions.enabled ? {
                            name: Math.random() ? 'fade' : 'crosszoom',
                            duration: 400
                        } : undefined
                    })
                    spinner.succeed('Concatenated videos')
                } catch (error) {
                    spinner.fail(`Failed to concatenate videos: ${error}`)
                }
            }
        }
```


# parseSubtitles()

Parses the subtitles so that they sync up with the rate of the speaker
