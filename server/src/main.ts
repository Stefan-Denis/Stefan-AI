/**
 * IMPORTS
 */
import * as commentJson from 'comment-json'
import fs from 'fs-extra'
import path from 'path'
import OpenAI from 'openai'
import ora, { Ora } from 'ora'
import dotenv from 'dotenv'
import { ChatCompletion } from 'openai/resources'
import chalk from 'chalk'

console.log(chalk.whiteBright('Stefan-AI') + chalk.whiteBright(' Video Automation Script Generator'))
console.log(chalk.bgWhiteBright(chalk.blackBright('Version: 2.0')))

/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

// DotENV
dotenv.config({ path: path.join(__dirname, '../', 'config', '.env') })

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
                 */
                enabled: boolean

                /**
                 * The list of transitions to use. Leave empty for auto transitions.
                 */
                selectedTransitions: string[]
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
        }
    }
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
 * - `prompt` (add skipGPT to skip GPT prompt generation and set to `true`)
 */
interface testInterface extends Object {
    enabled: boolean
    unitToTest: string
    skipGPT: true
    runOnce: boolean
}

const test: testInterface = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'config', 'test.json'), 'utf-8'))
let spinner: Ora

for (let x = 0; x < (test.runOnce ? 1 : combinations.length); x++) {
    console.log(`\n\n${chalk.whiteBright('Combination:')} ${x + 1}`)

    const currentCombination = combinations[x]
    await (async () => {

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



        await subtitles()
    })()
}

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

// Stop the app
crashHandler('no-crash')
process.exit(0)