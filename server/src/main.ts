/**
 * IMPORTS
 */
import * as commentJson from 'comment-json'
import fs from 'fs-extra'
import path from 'path'

/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

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
crashHandler('no-crash')


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
        console.log(`Estimated Videos: ${permutations.length}`)
    } catch (error) {
        console.log(error)
        process
    }
} else {
    console.log('Combinations were not generated because the app crashed.')
}

// ^ Main processing
const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json')
const combinations: combination = JSON.parse(fs.readFileSync(combinationsFilePath, 'utf-8'))

/**
 * Interface representing a system and user prompt.
 */
interface prompts extends Object {
    system: string
    user: string
}

const test: boolean = true

test ? console.log('Test mode is enabled') : null

const output = path.join(__dirname, '../', '../', 'output')
for (let x = 0; x < (test ? 1 : combinations.length); x++) {
    const currentCombination = combinations[x]
    await (async () => {
        /**
         * The prompts for the AI.
         */
        const prompts: prompts = {
            system: await constructPrompt('system'),
            user: await constructPrompt('user', currentCombination)
        }

        console.log('System prompt:')
        console.log(prompts.system)
        console.log('\n')
        console.log('User prompt:')
        console.log(prompts.user)
    })()
}

/**
 * @param It can recieve `system` or `user` as a string.
 * @returns The Prompt
 */
async function constructPrompt(type: string, currentCombination?: subCombination): Promise<string> {
    let prompt = ''

    if (type === 'system') {
        prompt =
            `You are great at doing many things, but your output is bad, here is how to format the output in .json format:

{
    "video1": {
        "isUsed": true or false depending if you want to use it,
        "subtitle": "Insert clip subtitle here"
    },
    "video2": {
        "isUsed": true or false depending if you want to use it,
        "subtitle": "Insert clip subtitle here"
    },
    "video3": {
        "isUsed": true or false depending if you want to use it,
        "subtitle": "Insert clip subtitle here"
    }
}

Here are the optional settings that can be enabled by the user:
isUsed = used when the user sets the prompt setting 'dynamicVideoSelection' to true, it allows you to determine if a video shall be used. If you determine that the video shoudnt be used, then dont use it by setting for the video object the isUsed property to "false"
    more on the "isUsed" property:
    - You must only be allowed to select 1 video to not be used if you determine that it shouldnt be used and if the user set it to true

Settings for generation:
dynamicVideoSelection: ${app.settings.easy.dynamicVideoSelection}

General Rules to follow for any kind of video:
1. Do not ever say the word "embrace" 
2. match the speakers word per minute with the times given in the user prompt
3. Do not ever embrace or suggest to find courage in stuff. You often say stuff like "find courage in darkness" which sounds depressing.
4. Do not ever say the word "embrace" 

What matters most during production.
Accord more importance to the general theme of the video than the individual video clips, 80% to the video theme and let the video clips influence you just a bit so that the message isn't not-matching to the content `
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

        console.log(arrayOfThemes)

        prompt =
            `I will need you to make a video script for the following videos:
${arrayOfThemes.map((theme, index) => `${index + 1}. ${theme}`).join('\n')}

The general theme the videos need to respect:
${app.settings.advanced.generalTheme}
    
Information regarding how long you need to make the script in total:
- minimum length: ${app.settings.easy.length.min} seconds
- maximum length: ${app.settings.easy.length.max} seconds
- preferred length: ${app.settings.easy.length.preferred} seconds
- Current Voice Speaking Rate: 100 Words per Minute
* Make sure to calculate how many words you can squeeze into each subtitle.
Try to reach the limit

Here are the rules you need to follow:
${app.promptRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

Desired output:
"${app.settings.advanced.desiredOutput}"

Respond back with just the subtitles in the JSON format in the system prompt and make sure to not use whitespace in JSON
`
    }

    return prompt
}

// Stop the app
crashHandler('no-crash')
process.exit(0)