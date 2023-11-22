/**
 * IMPORTS
 */
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { ChatCompletion } from 'openai/resources'
import * as commentJson from 'comment-json'
import { spawnSync } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'
import concat from 'ffmpeg-concat'
import readline from 'readline'
import ora, { Ora } from 'ora'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import chalk from 'chalk'
import util from 'util'
import path from 'path'

console.log(chalk.whiteBright('Stefan-AI') + chalk.whiteBright(' Video Automation Script Generator'))
console.log(chalk.bgWhiteBright(chalk.blackBright('Version: 2.0')))

/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

// DotENV
dotenv.config({ path: path.join(__dirname, '../', 'config', '.env') })

// Set FFmpeg path
const ffmpegPath = path.join(__dirname, '../', 'modules', 'ffmpeg.exe')
ffmpeg.setFfmpegPath(ffmpegPath)
process.env.PATH = path.dirname(ffmpegPath) + path.delimiter + process.env.PATH
process.env.GENTLE_RESOURCES_ROOT = path.join(__dirname, '../', 'text-aligner', 'exp')

/**
 * Represents the settings for a video automation profile.
 */
interface VideoAutomationSettings extends Object {
    /**
     * The name of the profile.
     */
    profile: string

    /**
     * The prompt rules that will be given to the AI.
     */
    promptRules: [

    ]

    /**
     * The settings for the profile.
     */
    settings: {

        /**
         * The common settings for the profile.
         */
        easy: {

            /**
             * Whether to loop the video to create a seamless end to the video.
             */
            loop: boolean

            /**
             * Whether to shuffle the video clip order.
             */
            shuffle: boolean

            /**
             * How many times to use a certain video in combinations.
             * Should not be bigger than the amount of videos the app has been given
             */
            maxVideoUsage: number

            /**
             * How many videos can appear in a combination.
             * Should not be bigger than the amount of videos the app has been given
            */
            videosPerCombination: number

            /**
             * Use AI to allow the app to determine how many videos should actually be used for that combination.
              */
            dynamicVideoSelection: boolean

            /**
             * The length properties for the videos.
             */
            length: {
                /**
                 * The minimum length of the video in seconds.
                 */
                min: number

                /**
                 * The maximum length of the video in seconds.
                 */
                max: number

                /**
                 * The preferred length of the video in seconds.
                 */
                preferred: number
            }
        }

        /**
         * The advanced settings for the profile.
         */
        advanced: {

            /**
             * The maximum number of words that can appear on screen.
             */
            maxWordsOnScreen: number

            /**
             * The desired output for the video script, which complements the prompt.
             */
            desiredOutput: string

            /**
             * The transition settings for the video.
             */
            transitions: {
                /**
                 * Whether transitions are enabled.
                 * Automatically selected by the app
                 */
                enabled: boolean
            }

            /**
             * The general theme for the video, which the app knows how to process.
             * E.g: Motivational, Reddit stores as of now.
             */
            generalTheme: string

            /**
             * Whether to upscale the video quality with an unsharp filter.
             */
            upscale: boolean

            /**
             * Whether to make the colors better.
             */
            colorful: boolean

            /**
             * The contrast of the video. Maximum and recommended value is 1.3.
             */
            contrast: number

            /**
             * Amount of CPU cores, used for processing certain video tasks
             * Used primarily for MFA task
             */
            cpuCores: number
        }
    }
}

// Extra interfaces
interface Video {
    isUsed?: boolean
    extends?: boolean
    message?: string
}

interface StefanAIVideoScript {
    error?: string
    [key: string]: Video | string | undefined
}

/**
 * Wait function
 * @param ms The amount of milliseconds to wait.
 */
async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Checks if a file does not exist.
 * @param file - The path to the file to check.
 * @type {string}
 * @returns A boolean indicating whether the file does not exist.
 */
function notExists(file: string) {
    return !fs.existsSync(file)
}


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

/**
 * Represents the status of the crash handler.
 */
type crashHandlerStatus = boolean

/**
 * Path to the file that stores the crash information.
 */
const crashFile = path.join(__dirname, '../', 'config', 'crash.txt')
if (notExists(crashFile)) {
    console.error('crash file does not exist. Please select a profile in the profiles folder.')
    process.exit(1)
}

/**
 * Reads the crash file and returns the crash status.
 * @returns {boolean} true if the app crashed, false if it ran with no errors.
 */
let _crashStatus = fs.readFileSync(crashFile, 'utf-8')
const crashStatus: crashHandlerStatus = _crashStatus === 'false' ? false : true
crashHandler('crash')


// Load the settings from the profile file.
const selectedProfileFile = path.join(__dirname, '../', 'profiles', 'main.txt')
if (notExists(selectedProfileFile)) {
    console.error('main.txt does not exist. Please select a profile in the profiles folder.')
    process.exit(1)
}

const selectedProfile = fs.readFileSync(selectedProfileFile, 'utf-8')

/**
 * The path to the selected profile data file.
 * @type {string}
 */
const profileDataPath: string = path.join(__dirname, '../', 'profiles', selectedProfile)
if (notExists(profileDataPath)) {
    console.error('The selected profile does not exist. Please select a profile in the profiles folder.')
    process.exit(1)
}

const profileData = fs.readFileSync(profileDataPath, 'utf-8')

/**
 * Parses the selected profile and returns a VideoAutomationSettings object.
 * 
 * @param profileData - The selected profile to parse.
 * @type {string}
 * @returns A VideoAutomationSettings object.
 */

let _profileSettings: VideoAutomationSettings
try {
    _profileSettings = commentJson.parse(profileData) as unknown as VideoAutomationSettings
} catch (error: unknown) {
    console.error('Error parsing profile data:', error)
    process.exit(1)
}

const app: VideoAutomationSettings = _profileSettings

/**
 * Creates the combinations for the video.
 */
type combination = Array<subCombination>

/**
 * Represents an array that is inside the "combinations" type
 */
type subCombination = Array<string | boolean>

// Create new combinations only if the app did not crash.
if (!crashStatus) {

    // Files data
    const videoPath = path.join(__dirname, '../', 'videos')
    const files: Array<string> = fs.readdirSync(videoPath).filter(file => path.extname(file) === '.mp4')

    let permutations: combination = generateCombinations()

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

    const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json')

    try {
        fs.writeFileSync(combinationsFilePath, JSON.stringify(permutations, null, 4))
    } catch (error) {
        console.log(error)
        process
    }
} else {
    console.log(chalk.yellowBright('\n\n' + 'Combinations were not generated because the app crashed or an error occoured during processing.'))
    console.log(chalk.yellowBright('Warning: ') + `App will continue from previous combination. \n  If you want to start from the beginning, reset through the ${chalk.whiteBright('Stefan-AI')} app.`)
}

// ^ Main processing
const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json')
const combinations: combination = JSON.parse(fs.readFileSync(combinationsFilePath, 'utf-8'))

/**
 * Test Interface
 * @interface
 * @property {string} test - Test
 * @property {string} unitToTest - Input a unit to test from following list: 
 * - `subtitles` (add skipGPT to skip GPT prompt generation and set to `true`)
 * - `SSMLParser` 
 * - `TTS`
 * - `trimVideos`
 * - `concat`
 * - `parseTimings`
 * - `addSubtitles`
 */
interface testInterface extends Object {
    enabled: boolean
    unitToTest: string
    skipGPT: true
    runOnce: boolean
    updateCombinations: boolean
}

const test: testInterface = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'config', 'test.json'), 'utf-8'))
let spinner: Ora

for (let x = 0; x < (test.runOnce ? 1 : combinations.length); x++) {
    console.log(`\n\n${chalk.whiteBright('Combination:')} ${x + 1}`)

    const currentCombination = combinations[x]

    if (currentCombination[currentCombination.length - 1] === true) {
        continue
    }

    let videoLengthExceedsMax = false

    await (async () => {

        async function subtitles() {
            if ((test.enabled && test.unitToTest === 'subtitles') || !test.enabled) {
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
                        await wait(1000)
                        console.clear()
                        await subtitles()
                        return
                    }
                }

                if (test.skipGPT) {
                    await wait(1000)
                    spinner.succeed('Skipped GPT prompt generation.')
                }

                // Perform checks on the script
                spinner = ora('Performing checks on the script \n').start()
                await wait(1000)


                // Validate if its correct JSON
                try {
                    JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))
                    spinner.succeed('Validated JSON.')
                } catch {
                    spinner.fail('Failed to parse JSON.')

                    /**
                     * Restart
                     */
                    await wait(1000)
                    console.clear()
                    await subtitles()
                    return
                }

                // Due to it working, it will declare videoScript
                const videoScript: StefanAIVideoScript = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))

                // Check if the script has an error
                if (videoScript.error) {
                    spinner.fail('Error in video script.')
                    console.log('\n' + chalk.redBright('Error: ') + '\n' + videoScript.error)
                    console.log('\n')

                    /**
                     * Restart
                     */
                    await wait(1000)
                    console.clear()
                    await subtitles()
                    return
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

                // Check if the script has only 1 key but the app.settings.easy.videosPerCombination is over 1
                if (Object.keys(videoScript).length === 1 && app.settings.easy.videosPerCombination > 1) {
                    spinner.fail('Script has only 1 key but the app.settings.easy.videosPerCombination is over 1.')

                    /**
                     * Restart
                     */
                    await wait(1000)
                    console.clear()
                    await subtitles()
                    return
                }
            }
        }

        /**
         * Parses the SSML and returns the parsed SSML to a file.
         */
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
                            video.setDuration(durations[index])
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
                            name: Math.random() >= 500 ? 'fade' : 'crosszoom',
                            duration: 300
                        } : undefined
                    })
                    spinner.succeed('Concatenated videos')
                } catch (error) {
                    spinner.fail(`Failed to concatenate videos: ${error}`)
                }
            }
        }

        /**
         * Function to add subtitles to the video
         */
        async function parseTimings() {
            /**
             * Rules for the subtitles:
             *  - If there is a comma, there is a 0.4s break
             *  - A new line is a 0.5s break
             *  - If a video extends to the next one, the break is 0.17s 
             *  - Last line has no break
             */
            if ((test.enabled && test.unitToTest === 'parseTimings') || !test.enabled) {
                spinner = ora('Adding subtitles\n').start()

                // MFA paths
                const uniqueId = Date.now()
                const CORPUS_DIRECTORY = path.join(__dirname, '../', 'temporary', 'propietary', uniqueId.toString())
                const dictionaryPath = path.join(__dirname, '../', 'modules', 'english_us_arpa.dict')
                const acousticModelPath = path.join(__dirname, '../', 'modules', 'english_us_arpa')
                const outputDir = path.join(__dirname, '../', 'temporary', 'propietary', 'output')

                // Delete the corpus directory if it exists
                if (fs.existsSync(CORPUS_DIRECTORY)) {
                    fs.rmdirSync(CORPUS_DIRECTORY, { recursive: true })
                }

                // Create the corpus directory
                fs.mkdirSync(CORPUS_DIRECTORY, { recursive: true })

                // Delete the output directory if it exists
                if (fs.existsSync(outputDir)) {
                    fs.rmdirSync(outputDir, { recursive: true })
                }

                // Create the output directory
                fs.mkdirSync(outputDir, { recursive: true })

                // Convert MP3 to WAV
                const audioPath = path.join(__dirname, '../', 'temporary', 'editing', 'audio', 'audio.mp3')
                const wavAudioPath = path.join(CORPUS_DIRECTORY, 'audio.wav')

                const ffmpeg = spawnSync('ffmpeg', ['-i', audioPath, wavAudioPath])

                if (ffmpeg.error) {
                    console.log('An error occurred: ' + ffmpeg.error.message)
                }

                // Prepare Transcript File
                const videoScriptJSON: StefanAIVideoScript = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'))

                fs.existsSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio', 'temp.mp3')) ? fs.unlinkSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio', 'temp.mp3')) : null
                fs.writeFileSync(path.join(CORPUS_DIRECTORY, 'audio.lab'), '')

                for (const key in videoScriptJSON) {
                    const video = videoScriptJSON[key]
                    fs.appendFileSync(path.join(CORPUS_DIRECTORY, 'audio.lab'), (video as Video)!.message as string + '\n')
                }

                // Start MFA
                const process = spawnSync('mfa', ['align', '--single_speaker', '--num_jobs', `${app.settings.advanced.cpuCores}`, CORPUS_DIRECTORY, dictionaryPath, acousticModelPath, outputDir])
                console.log(process.stderr ? process.stderr.toString() : '')
                console.log(process.stdout ? process.stdout.toString() : '')

                spinner.succeed('Added subtitles')

                // Delete the corpus directory
                fs.rmdirSync(CORPUS_DIRECTORY, { recursive: true })

                return parseTextGrid(path.join(outputDir, 'audio.TextGrid')) as Promise<Array<object>>
            }
        }

        interface Timing {
            xmin: number
            xmax: number
            text: string
        }

        async function parseSubtitles(timings: Array<Timing>) {
            if ((test.enabled && test.unitToTest === 'parseTimings') || !test.enabled) {
                spinner = ora('Creating subtitle file').start()

                // prepare subtitle file
                const defaultFile = path.join(__dirname, '../', 'temporary', 'propietary', 'default.ass')
                const subtitleFile = path.join(__dirname, '../', 'temporary', 'propietary', 'subtitles.ass')

                const defaultSubtitleData = fs.readFileSync(defaultFile, 'utf-8')
                fs.writeFileSync(subtitleFile, defaultSubtitleData)

                timings.forEach((timing: Timing) => {
                    const minTime = formatTime(timing.xmin)
                    const maxTime = formatTime(timing.xmax)
                    const text = timing.text

                    const subtitle = createSubtitle(minTime, maxTime, text)

                    fs.appendFileSync(subtitleFile, '\n' + subtitle)
                })

                spinner.succeed('Created subtitle file')
            }
        }

        async function addSubtitles() {
            if ((test.enabled && test.unitToTest === 'addSubtitles') || !test.enabled) {
                spinner = ora('Adding subtitles to video').start()

                const subtitlesFile = path.join('../', 'temporary', 'propietary', 'subtitles.ass').replace(/\\/g, '/')
                const videoFile = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'concat', 'output.mp4').replace(/\\/g, '/')
                const outputFile = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'subtitle', 'output.mp4').replace(/\\/g, '/')

                // Check if the subtitle file exists
                if (!fs.existsSync(subtitlesFile)) {
                    console.error(`Subtitle file does not exist: ${subtitlesFile}`)
                    return
                }

                // Check if the video file exists
                if (!fs.existsSync(videoFile)) {
                    console.error(`Video file does not exist: ${videoFile}`)
                    return
                }

                // Check if the output directory exists and create it if not
                const outputDir = path.dirname(outputFile)
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true })
                }

                fs.emptyDirSync(outputDir)

                const ffmpeg = spawnSync(ffmpegPath, ['-i', videoFile, '-vf', `ass=${subtitlesFile}`, outputFile])

                spinner.succeed('Added subtitles to video')
            }
        }

        async function addAudios() {
            if ((test.enabled && test.unitToTest === 'addAudios') || !test.enabled) {
                spinner = ora('Adding TTS to video').start()

                const ttsFile = path.join(__dirname, '../', 'temporary', 'editing', 'audio', 'audio.mp3')
                const videoFile = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'subtitle', 'output.mp4')
                const outputFileLocation = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'ttsAdded', 'output.mp4')

                /**
                 * Would of used a ternary operator but it wrote `undefined` in the console
                 */
                if (fs.existsSync(outputFileLocation)) {
                    fs.unlinkSync(outputFileLocation)
                }

                /**
                 * Add tts with ffmpeg on top of the audio
                 * TODO add music on top as well
                 */
                const ffmpeg = spawnSync(ffmpegPath, ['-i', videoFile, '-i', ttsFile, '-c:v', 'copy', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0', '-shortest', '-y', outputFileLocation])
                spinner.succeed('Added TTS to video')
            }
        }

        async function postFX() {
            /**
             * Change certain video settings such as:
             * `upscale` -> with the unsharp filter
             * `colorful` -> make the video more colorful
             * `contrast` -> set the contrast of the video
             */
            if ((test.enabled && test.unitToTest === 'postFX') || !test.enabled) {
                let spinner = ora('Upscaling Video and applying visual settings').start()

                const videoFile = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'ttsAdded', 'output.mp4')
                const outputFileLocation = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'postFX', 'output.mp4')

                if (fs.existsSync(outputFileLocation)) {
                    fs.unlinkSync(outputFileLocation)
                }

                let filters = []

                if (app.settings.advanced.upscale) {
                    filters.push('unsharp=5:5:1.0:5:5:0.0')
                }


                if (app.settings.advanced.colorful && app.settings.advanced.contrast) {
                    let contrast = app.settings.advanced.contrast ? app.settings.advanced.contrast : 1.3
                    filters.push(`eq=brightness=0.06:contrast=${contrast}:saturation=1.5`)
                }

                else if (app.settings.advanced.colorful && !app.settings.advanced.contrast) {
                    filters.push('eq=brightness=0.06:contrast=1.0:saturation=1.5')
                }

                else if (!app.settings.advanced.colorful && app.settings.advanced.contrast) {
                    let contrast = app.settings.advanced.contrast ? app.settings.advanced.contrast : 1.3
                    filters.push(`eq=brightness=0.06:contrast=${contrast}:saturation=1.0`)
                }

                const args = ['-i', videoFile, '-vf', filters.join(','), outputFileLocation]
                const result = spawnSync('ffmpeg', args)

                if (result.error) {
                    console.log(result.error)
                    spinner.fail('postFX failed')
                    throw result.error
                } else {
                    spinner.succeed('postFX done')
                    return true
                }
            }
        }

        await subtitles()
        await SSMLParser()
        await TTS()

        // Trim Videos
        /**
         * @param lengths
         * @returns The video lengths
         * Returns the lengths of each video in an array
         */
        const lengths: Array<number> = await getVideoLengths()

        // Check if lengths are more than max in settings length + other error checks
        const sum = lengths.reduce((a, b) => a + b, 0)

        // Get length with ffmpeg
        const audioFile = path.join(__dirname, '../', 'temporary', 'editing', 'audio', 'audio.mp3')
        const ffprobe = spawnSync(path.join(__dirname, '../', 'modules', 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioFile])

        const audioLength = parseFloat(Number(ffprobe.stdout.toString()).toFixed(3))

        if (sum > app.settings.easy.length.max || audioLength <= 1) {
            videoLengthExceedsMax = true
        }

        if (!videoLengthExceedsMax) {
            await trimVideos(lengths)
            await concatVideos()

            /**
             * Parse the subtitles into timings -> Create subtitle file
             */
            /**
             * Contains the timings for each word
             */
            const timings = await parseTimings() as Array<object>
            console.log(timings === undefined ? '' : timings)
            await parseSubtitles(timings as Timing[])

            /**
             * Add the subtitles to the video
             */

            await addSubtitles()

            /**
             * Add audio speech file to the video
             */
            await addAudios()

            /**
             * Final touches to make the video more appealing
             */
            await postFX()
        }
    })()

    if (!videoLengthExceedsMax) {
        if (test.updateCombinations) {
            currentCombination[currentCombination.length - 1] = true

            // Update the main combination
            combinations[x] = currentCombination

            // Write the combinations to file
            fs.writeFileSync(combinationsFilePath, JSON.stringify(combinations, null, 4))
        }
    } else {
        x--
        continue
    }
}

/**
 * Format seconds into .ass time
 * @param time
 */
function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
}

/**
 * Create Advanced SubStation Alpha format subtitles
 * @param startTime
 * @param endTime
 * @param text
 */
function createSubtitle(startTime: string, endTime: string, text: string) {
    return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`
}

/**
 * @param script 
 * @param filename 
 * @param voice
 * Keep the voice the same during the whole subtitle generation process
 * Creates 1 mp3 file with the given filename inside __dirname + ../temporary/propietary
 */
async function createTTS(script: string, filename: string, voice: string, ssml?: boolean) {
    const client = new TextToSpeechClient()

    const request: object = {
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "effectsProfileId": [
                "small-bluetooth-speaker-class-device"
            ],
            "pitch": -15,
            "speakingRate": 0.931
        },
        "input": ssml ? { "ssml": script } : { "text": script },
        "voice": {
            "languageCode": "en-US",
            "name": voice
        }
    }

    fs.existsSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio', `${filename}.mp3`)) ?
        fs.unlinkSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio', `${filename}.mp3`)) :
        null

    // Write mp3 data to file
    const [response] = await client.synthesizeSpeech(request)
    const writeFile = util.promisify(fs.writeFile)
    await writeFile(path.join(__dirname, '../', 'temporary', 'editing', 'audio', `${filename}.mp3`), response.audioContent as string, 'binary')
}


/**
 * @param type can recieve `system` or `user` as a string.
 * @param currentCombination `(optional)` can recieve The current combination of videos.
 * @returns The Prompt
 */
async function constructPrompt(type: string, currentCombination?: subCombination): Promise<string> {

    /**
     * Formatted user prompt for either
     * `user` or `system`
     * @param `user prompt` requires the current combination of videos
     */
    let prompt = ''

    if (type === 'system') {
        /**
         * Formatted prompt for the system
         */
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

        /**
         * The video combination object
         */
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

        /**
         * Formatted user prompt for GPT
         */
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
            Please process the videos and generate the subtitles for them in fluent english only.
            `
    }

    return prompt
}

/**
 * @param textGridPath The path to the TextGrid file.
 * @returns An array of items.
 * Used in this specific case, to parse the TextGrid file generated by MFA
 */
async function parseTextGrid(filePath: string): Promise<Array<object>> {
    const fileStream = fs.createReadStream(filePath)

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let itemIndex = 0
    let intervals: any[] = []
    let currentInterval: any = {}

    for await (const line of rl) {
        if (line.includes('item [1]:')) {
            itemIndex = 1
        } else if (line.includes('item [2]:')) {
            itemIndex = 2
        }

        if (itemIndex === 1) {
            // Parse the lines for item [1]
            if (line.includes('intervals')) {
                if (Object.keys(currentInterval).length > 0 && 'text' in currentInterval) {
                    intervals.push(currentInterval)
                }
                currentInterval = {}
            } else {
                const match = line.match(/(\w+) = (.+)/)
                if (match) {
                    const key = match[1]
                    const value = match[2].replace(/"/g, '')
                    currentInterval[key] = value
                }
            }
        }
    }

    // Push the last interval
    if (Object.keys(currentInterval).length > 0 && 'text' in currentInterval) {
        intervals.push(currentInterval)
    }

    return intervals
}

// Stop the app
crashHandler('no-crash')
process.exit(0)