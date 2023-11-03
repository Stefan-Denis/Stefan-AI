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
            console.log(matrix);
        }
        /**
         * False is added to keep track which combinations have been made.
         * The first false array is the last one processed
         */
        combinations.forEach(combination => {
            combination.push(false);
        });
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
const output = path.join(__dirname, '../', '../', 'output');
for (let x = 0; x < combinations.length; x++) {
    await (() => __awaiter(void 0, void 0, void 0, function* () {
        // Construct prompts
        const prompts = {
            system: yield constructPrompt('system'),
            user: yield constructPrompt('user')
        };
    }))();
}
/**
 * @param It can recieve `system` or `user` as a string.
 * @returns The Prompt
 */
function constructPrompt(type) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompt = '';
        if (type === 'system') {
            prompt +=
                `You are great at doing many things, but your output is bad, here is how to format the output in .json format:

        {
            "video1": {
                "isUsed": true or false,
                "subtitle": "Insert clip subtitle here"
            },
            "video2": {
                "isUsed": true or false,
                "subtitle": "Insert clip subtitle here"
            },
            "video3": {
                "isUsed": true or false,
                "subtitle": "Insert clip subtitle here"
            }
        }

        Here are the optional settings that can be enabled by the user:
        isUsed = used when the user sets the prompt setting 'dynamicVideoSelection' to true, it allows you to determine if a video shall be used. If you determine that the video shoudnt be used, then dont use it by setting for the video object the isUsed property to "false"

        Settings for generation:
        dynamicVideoSelection: ${app.settings.easy.dynamicVideoSelection}
        `;
        }
        else if (type === 'user') {
        }
        return prompt;
    });
}
// Stop the app
crashHandler('no-crash');
process.exit(0);
