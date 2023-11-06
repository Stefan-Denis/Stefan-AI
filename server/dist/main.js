var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * IMPORTS
 */
import * as commentJson from 'comment-json';
import fs from 'fs-extra';
import path from 'path';
/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
/**
 * Checks if a file does not exist.
 * @param file - The path to the file to check.
 * @type {string}
 * @returns A boolean indicating whether the file does not exist.
 */
function notExists(file) {
    return !fs.existsSync(file);
}
// App crash handler
/**
 * Handles the crash state of the application by writing a boolean value to a file.
 * @param state The state of the application, either 'crash' or 'no-crash'.
 */
function crashHandler(state) {
    if (state === 'crash') {
        fs.writeFileSync(crashFile, 'true');
    }
    else if (state === 'no-crash') {
        fs.writeFileSync(crashFile, 'false');
    }
}
/**
 * Path to the file that stores the crash information.
 */
const crashFile = path.join(__dirname, '../', 'config', 'crash.txt');
if (notExists(crashFile)) {
    console.error('crash file does not exist. Please select a profile in the profiles folder.');
    process.exit(1);
}
/**
 * Reads the crash file and returns the crash status.
 * @returns {boolean} true if the app crashed, false if it ran with no errors.
 */
let _crashStatus = fs.readFileSync(crashFile, 'utf-8');
const crashStatus = _crashStatus === 'false' ? false : true;
crashHandler('no-crash');
// Load the settings from the profile file.
const selectedProfileFile = path.join(__dirname, '../', 'profiles', 'main.txt');
if (notExists(selectedProfileFile)) {
    console.error('main.txt does not exist. Please select a profile in the profiles folder.');
    process.exit(1);
}
const selectedProfile = fs.readFileSync(selectedProfileFile, 'utf-8');
/**
 * The path to the selected profile data file.
 * @type {string}
 */
const profileDataPath = path.join(__dirname, '../', 'profiles', selectedProfile);
if (notExists(profileDataPath)) {
    console.error('The selected profile does not exist. Please select a profile in the profiles folder.');
    process.exit(1);
}
const profileData = fs.readFileSync(profileDataPath, 'utf-8');
/**
 * Parses the selected profile and returns a VideoAutomationSettings object.
 *
 * @param profileData - The selected profile to parse.
 * @type {string}
 * @returns A VideoAutomationSettings object.
 */
let _profileSettings;
try {
    _profileSettings = commentJson.parse(profileData);
}
catch (error) {
    console.error('Error parsing profile data:', error);
    process.exit(1);
}
const app = _profileSettings;
// Create new combinations only if the app did not crash.
if (!crashStatus) {
    // Files data
    const videoPath = path.join(__dirname, '../', 'videos');
    const files = fs.readdirSync(videoPath).filter(file => path.extname(file) === '.mp4');
    let permutations = generateCombinations();
    function generateCombinations() {
        const matrix = [];
        const combinations = [];
        const maxUsage = app.settings.easy.maxVideoUsage;
        const videosPerCombination = app.settings.easy.videosPerCombination;
        // Initialize the matrix
        files.forEach(file => {
            matrix.push([file, 0]);
        });
        // Generate combinations
        for (let i = 0; i < matrix.length; i++) {
            const combination = [];
            let j = i;
            while (combination.length < videosPerCombination && j < matrix.length) {
                // Check if video has not been used more than maxUsage times
                if (matrix[j][1] < maxUsage) {
                    combination.push(matrix[j][0]);
                    matrix[j][1] = matrix[j][1] + 1;
                }
                j++;
            }
            if (combination.length === videosPerCombination) {
                combinations.push(combination);
            }
        }
        /**
         * False is added to keep track which combinations have been made.
         * The first false array is the last one processed
         */
        combinations.forEach(combination => {
            combination.push(false);
        });
        // Shuffle the cominations if app.settings.easy.shuffle === true
        if (app.settings.easy.shuffle) {
            for (let i = combinations.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combinations[i], combinations[j]] = [combinations[j], combinations[i]];
            }
        }
        return combinations;
    }
    const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json');
    try {
        fs.writeFileSync(combinationsFilePath, JSON.stringify(permutations, null, 4));
        console.log(`Estimated Videos: ${permutations.length}`);
    }
    catch (error) {
        console.log(error);
        process;
    }
}
else {
    console.log('Combinations were not generated because the app crashed.');
}
// ^ Main processing
const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json');
const combinations = JSON.parse(fs.readFileSync(combinationsFilePath, 'utf-8'));
const test = true;
test ? console.log('Test mode is enabled') : null;
const output = path.join(__dirname, '../', '../', 'output');
for (let x = 0; x < (test ? 1 : combinations.length); x++) {
    const currentCombination = combinations[x];
    await (() => __awaiter(void 0, void 0, void 0, function* () {
        /**
         * The prompts for the AI.
         */
        const prompts = {
            system: yield constructPrompt('system'),
            user: yield constructPrompt('user', currentCombination)
        };
        console.log('System prompt:');
        console.log(prompts.system);
        console.log('\n');
        console.log('User prompt:');
        console.log(prompts.user);
    }))();
}
/**
 * @param It can recieve `system` or `user` as a string.
 * @returns The Prompt
 */
function constructPrompt(type, currentCombination) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompt = '';
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
Accord more importance to the general theme of the video than the individual video clips, 80% to the video theme and let the video clips influence you just a bit so that the message isn't not-matching to the content `;
        }
        else if (type === 'user') {
            if (!currentCombination) {
                console.error('currentCombination is undefined for user prompt');
                process.exit(1);
            }
            // Determine video Themes
            const videoThemesPath = path.join(__dirname, '../', 'config', 'theme.json');
            const videoThemes = JSON.parse(fs.readFileSync(videoThemesPath, 'utf-8'));
            const videoDirPath = path.join(__dirname, '../', 'videos');
            const amountOfVideos = fs.readdirSync(videoDirPath).filter(file => path.extname(file) === '.mp4').length;
            const videoCombination = {};
            for (let i = 1; i <= app.settings.easy.videosPerCombination; i++) {
                videoCombination[`video${i}`] = {
                    theme: "",
                };
            }
            for (const key in videoCombination) {
                for (let x = 0; x < amountOfVideos; x++) {
                    const video = currentCombination[parseInt(key.replace('video', '')) - 1];
                    if (video === videoThemes[x][0]) {
                        videoCombination[key].theme = videoThemes[x][1];
                    }
                }
            }
            let arrayOfThemes = [];
            for (const key in videoCombination) {
                arrayOfThemes.push(videoCombination[key].theme);
            }
            console.log(arrayOfThemes);
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
`;
        }
        return prompt;
    });
}
// Stop the app
crashHandler('no-crash');
process.exit(0);
