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
import OpenAI from 'openai';
import ora from 'ora';
import dotenv from 'dotenv';
/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
// DotENV
dotenv.config({ path: path.join(__dirname, '../', 'config', '.env') });
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
test ? console.log('Test mode is enabled\n') : null;
let spinner;
for (let x = 0; x < (test ? 1 : combinations.length); x++) {
    const currentCombination = combinations[x];
    await (() => __awaiter(void 0, void 0, void 0, function* () {
        /**
         * The prompts for the AI.
         * @type {prompts}
         * @property {string} system - The system prompt.
         * @property {string} user - The user prompt.
         */
        const prompts = {
            system: (yield constructPrompt('system')).trimLeft(),
            user: (yield constructPrompt('user', currentCombination)).trimLeft()
        };
        console.log(prompts.system);
        console.log(prompts.user);
        /**
         * The OpenAI Class.
         */
        const openai = new OpenAI({
            apiKey: process.env.GPT_KEY
        });
        spinner = ora('Generating video script').start();
        try {
            let videoScript = yield openai.chat.completions.create({
                messages: [
                    { "role": "system", "content": prompts.system },
                    { "role": "user", "content": prompts.user }
                ],
                model: 'ft:gpt-3.5-turbo-0613:tefan::8HXeI0yK',
                temperature: 1,
                max_tokens: 256
            });
            videoScript = videoScript.choices[0].message.content;
            fs.writeFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), videoScript);
            spinner.succeed('Generated video script and written to file.');
        }
        catch (error) {
            spinner.fail('Failed to generate video script.');
            crashHandler('crash');
            process.exit(1);
        }
    }))();
}
/**
 * @param type can recieve `system` or `user` as a string.
 * @param currentCombination `(optional)` can recieve The current combination of videos.
 * @returns The Prompt
 */
function constructPrompt(type, currentCombination) {
    return __awaiter(this, void 0, void 0, function* () {
        let prompt = '';
        if (type === 'system') {
            prompt =
                `You are an AI assistant for Stefan-AI, an app that uses a powerful settings file and inputted videos to create short form content for TikTok and YouTube Shorts.
            Your task is to process the given video data and generate a JSON output that determines which videos should be used in the content creation process, and provide a message for each video.
            You have the following features at your disposal: Dynamic Video Selection, Min, Max & Preferred Length, Rules, Desired Output, General Theme, Video Themes.
            Based on these features, generate a JSON output in the following format: {\"video1\": {\"isUsed\": true, \"message\": \"insert message here\"}, \"video2\": {\"isUsed\": true, \"message\": \"insert message here\"}, \"video3\": {\"isUsed\": true, \"message\": \"insert message here\"}}.
            Remember, the number of objects in the output should match the number of videos provided in the prompt, also, if its convenient, you can make it so that the message splits on multiple videos, just add a property to the JSON named "extends" and set it to true if thats the case.`;
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
            `;
        }
        return prompt;
    });
}
// Stop the app
crashHandler('no-crash');
process.exit(0);
