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
 * VIDEO AUTOMATION SETTINGS INTERFACE
 * Represents the settings for the video automation script.
 */
/**
 * Represents the settings for a video automation profile.
 */
interface VideoAutomationSettings {
    /**
     * The name of the profile.
     */
    profile: string

    /**
     * The prompt that will be given to the AI.
     */
    prompt: string

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
             */
            maxVideoUsage: number

            /**
             * How many videos can appear in a combination.
             */
            videosPerCombination: number

            /**
             * Whether to allow the app to determine how many videos to use for that combination.
             */
            dynamicVideoEditing: boolean

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
const crashStatus: crashHandlerStatus = _crashStatus === 'true' ? true : false
console.log(crashStatus)
console.log(typeof crashStatus)
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

const profileSettings: VideoAutomationSettings = _profileSettings

/**
 * Creates the combinations for the video.
 */
type combination = Array<subCombination>

/**
 * Represents an array that is inside the "combinations" type
 */
type subCombination = [string, string, string, boolean]

// Create new combinations only if the app did not crash.
if (!crashStatus) {
    let permutations: combination = []

    const videoPath = path.join(__dirname, '../', 'videos')
    const files: Array<string> = fs.readdirSync(videoPath).filter(file => path.extname(file) === '.mp4')

    const len = files.length

    for (let i: number = 0; i < len; i++) {
        for (let j: number = 0; j < len; j++) {
            for (let k: number = 0; k < len; k++) {
                if (i !== j && j !== k && k !== i) {
                    permutations.push([files[i], files[j], files[k], false] as subCombination)
                }
            }
        }
    }

    const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json')
    fs.writeFileSync(combinationsFilePath, JSON.stringify(permutations, null, 4))
} else {
    console.log('false')
}

// Stop the app
crashHandler('no-crash')
process.exit(0)