/**
 * IMPORTS
 */
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as commentJson from 'comment-json';
import { spawnSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ora from 'ora';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import chalk from 'chalk';
import util from 'util';
import path from 'path';
console.log(chalk.whiteBright('Stefan-AI') + chalk.whiteBright(' Video Automation Script Generator'));
console.log(chalk.bgWhiteBright(chalk.blackBright('Version: 2.0')));
/**
 * __DIRNAME VARIABLE
 */
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
// DotENV
dotenv.config({ path: path.join(__dirname, '../', 'config', '.env') });
// Set FFmpeg path
const ffmpegPath = path.join(__dirname, '../', 'modules', 'ffmpeg.exe');
ffmpeg.setFfmpegPath(ffmpegPath);
/**
 * Wait function
 * @param ms The amount of milliseconds to wait.
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
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
crashHandler('crash');
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
    console.log(chalk.yellowBright('\n\n' + 'Combinations were not generated because the app crashed or an error occoured during processing.'));
    console.log(chalk.yellowBright('Warning: ') + `App will continue from previous combination. \n  If you want to start from the beginning, reset through the ${chalk.whiteBright('Stefan-AI')} app.`);
}
// ^ Main processing
const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json');
const combinations = JSON.parse(fs.readFileSync(combinationsFilePath, 'utf-8'));
const test = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'config', 'test.json'), 'utf-8'));
let spinner;
for (let x = 0; x < (test.runOnce ? 1 : combinations.length); x++) {
    console.log(`\n\n${chalk.whiteBright('Combination:')} ${x + 1}`);
    const currentCombination = combinations[x];
    await (async () => {
        async function subtitles() {
            if ((test.enabled && test.unitToTest === 'subtitles') || !test.enabled) {
                /**
                 * The prompts for the AI.
                 * @type {prompts}
                 * @property {string} system - The system prompt.
                 * @property {string} user - The user prompt.
                 */
                const prompts = {
                    system: (await constructPrompt('system')).trimStart(),
                    user: (await constructPrompt('user', currentCombination)).trimStart()
                };
                /**
                 * The OpenAI Class.
                 */
                const openai = new OpenAI({
                    apiKey: process.env.GPT_KEY
                });
                spinner = ora('Generating video script').start();
                if (!test.skipGPT || !test.enabled) {
                    try {
                        let videoScript = await openai.chat.completions.create({
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
                        /**
                         * Restart
                         */
                        await wait(1000);
                        console.clear();
                        await subtitles();
                        return;
                    }
                }
                if (test.skipGPT) {
                    await wait(1000);
                    spinner.succeed('Skipped GPT prompt generation.');
                }
                // Perform checks on the script
                spinner = ora('Performing checks on the script \n').start();
                await wait(1000);
                // Validate if its correct JSON
                try {
                    JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'));
                    spinner.succeed('Validated JSON.');
                }
                catch {
                    spinner.fail('Failed to parse JSON.');
                    /**
                     * Restart
                     */
                    await wait(1000);
                    console.clear();
                    await subtitles();
                    return;
                }
                // Due to it working, it will declare videoScript
                const videoScript = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'));
                // Check if the script has an error
                if (videoScript.error) {
                    spinner.fail('Error in video script.');
                    console.log('\n' + chalk.redBright('Error: ') + '\n' + videoScript.error);
                    console.log('\n');
                    /**
                     * Restart
                     */
                    await wait(1000);
                    console.clear();
                    await subtitles();
                    return;
                }
                // Check if AI set all the videos to not be used
                let allNotUsed = true;
                for (let key in videoScript) {
                    let video = videoScript[key];
                    if (typeof video !== 'string' && video?.isUsed) {
                        allNotUsed = false;
                        break;
                    }
                }
                // If all videos are not used, set them all to be used
                if (allNotUsed) {
                    for (let key in videoScript) {
                        let video = videoScript[key];
                        if (typeof video !== 'string' && video?.isUsed !== undefined) {
                            video.isUsed = true;
                        }
                    }
                }
            }
        }
        /**
         * Parses the SSML and returns the parsed SSML to a file.
         */
        async function SSMLParser() {
            if ((test.enabled && test.unitToTest === 'SSMLParser') || !test.enabled) {
                spinner = ora('Parsing SSML').start();
                await wait(1200);
                let matrix = [];
                const ssmlFilePath = path.join(__dirname, '../', 'temporary', 'propietary', 'subtitles.ssml');
                const videoScriptJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'));
                for (const key in videoScriptJSON) {
                    const video = videoScriptJSON[key];
                    if (typeof video !== 'string' && video?.isUsed) {
                        matrix.push([video.message]);
                    }
                    if (typeof video !== 'string' && video?.extends) {
                        matrix[matrix.length - 1].push(true);
                    }
                }
                let SSML = '<speak>\n';
                try {
                    for (let x = 0; x < matrix.length; x++) {
                        let subtitle = matrix[x][0].replace(/,/g, ',<break time="0.4s"/>');
                        subtitle = subtitle.replace(/\bif\b/gi, '<emphasis level="strong">if</emphasis>');
                        SSML += `<p><s>${subtitle}</s></p>\n`;
                        if (matrix[x][1]) {
                            SSML += '<break time="0.17s"/>\n';
                        }
                        else if (x === matrix.length - 1) {
                        }
                        else {
                            SSML += '<break time="0.5s"/>\n';
                        }
                    }
                }
                finally {
                    SSML += '</speak>';
                }
                fs.writeFileSync(ssmlFilePath, SSML);
                spinner.succeed('Parsed SSML.');
            }
        }
        const voice = Math.random() > 0.5 ? "en-US-Neural2-D" : "en-US-Neural2-J";
        async function TTS() {
            if ((test.enabled && test.unitToTest === 'TTS') || !test.enabled) {
                fs.emptydirSync(path.join(__dirname, '../', 'temporary', 'editing', 'audio'));
                /**
                 * The voice to use for the TTS.
                 */
                // Concatenate the files depending on the settings
                spinner = ora('Creating TTS file').start();
                const SSMLContents = fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'subtitles.ssml'), 'utf-8');
                await createTTS(SSMLContents, 'audio', voice, true);
                spinner.succeed('Created TTS file');
            }
        }
        async function getVideoLengths() {
            const subtitlesLength = [];
            if ((test.enabled && test.unitToTest === 'trimVideos') || !test.enabled) {
                spinner = ora('Retrieving Video Lengths').start();
                // Get the length of each subtitle
                async function testLength(videonr) {
                    let SSML = '<speak>\n';
                    // Parse to SSMl
                    try {
                        let subtitle = videoScriptJSON[`video${videonr}`].message.replace(/,/g, ',<break time="0.4s"/>');
                        subtitle = subtitle.replace(/\bif\b/gi, '<emphasis level="strong">if</emphasis>');
                        SSML += `<p><s>${subtitle}</s></p>\n`;
                        if (videoScriptJSON[`video${videonr}`].extends) {
                            SSML += '<break time="0.17s"/>\n';
                        }
                        else {
                            SSML += '<break time="0.5s"/>\n';
                        }
                    }
                    finally {
                        SSML += '</speak>';
                    }
                    await createTTS(SSML, 'temp', voice, true);
                    // Get the length of the audio file
                    const tempAudioFilePath = path.join(__dirname, '../', 'temporary', 'editing', 'audio', `temp.mp3`);
                    const ffprobe = spawnSync(path.join(__dirname, '../', 'modules', 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', tempAudioFilePath]);
                    subtitlesLength.push(parseFloat(Number(ffprobe.stdout.toString()).toFixed(3)));
                }
                const videoScriptJSON = await JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'temporary', 'propietary', 'prompt.json'), 'utf-8'));
                const keys = Object.keys(videoScriptJSON);
                for (const key of keys) {
                    const videoNumber = parseInt(key.replace('video', ''));
                    await testLength(videoNumber);
                }
                spinner.succeed('Got video durations');
            }
            return subtitlesLength;
        }
        async function trimVideos(durations) {
            if ((test.enabled && test.unitToTest === 'trimVideos') || !test.enabled) {
                try {
                    const trimDir = path.join(__dirname, '../', 'temporary', 'editing', 'video', 'trim');
                    fs.emptyDirSync(trimDir);
                    for (let index = 0; index < durations.length; index++) {
                        spinner = ora('Trimming video ' + (index + 1)).start();
                        const duration = durations[index];
                        const currentClip = currentCombination[index];
                        const videoPath = path.join(__dirname, '../', 'videos', currentClip);
                        const video = ffmpeg(videoPath);
                        video.setStartTime(0);
                        video.setDuration(duration);
                        video.output(path.join(trimDir, `${index + 1}.mp4`));
                        await new Promise((resolve, reject) => {
                            video.on('error', (error) => {
                                console.log(error);
                                reject(error);
                            });
                            video.on('end', () => {
                                spinner.succeed('Trimmed video ' + (index + 1));
                                resolve(true);
                            });
                            video.run();
                        });
                    }
                }
                catch {
                    spinner.fail('Failed to trim videos');
                }
            }
        }
        await subtitles();
        await SSMLParser();
        await TTS();
        // Trim Videos
        /**
         * @param lengths
         * @returns The video lengths
         * Returns the lengths of each video in an array
         */
        const lengths = await getVideoLengths();
        await trimVideos(lengths);
        // TODO: Continue the app
    })();
}
/**
 * @param script
 * @param filename
 * @param voice
 * Keep the voice the same during the whole subtitle generation process
 * Creates 1 mp3 file with the given filename inside __dirname + ../temporary/propietary
 */
async function createTTS(script, filename, voice, ssml) {
    const client = new TextToSpeechClient();
    const request = {
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
    };
    // Write mp3 data to file
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(path.join(__dirname, '../', 'temporary', 'editing', 'audio', `${filename}.mp3`), response.audioContent, 'binary');
}
/**
 * @param type can recieve `system` or `user` as a string.
 * @param currentCombination `(optional)` can recieve The current combination of videos.
 * @returns The Prompt
 */
async function constructPrompt(type, currentCombination) {
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
            Please process the videos and generate the subtitles for them in fluent english only.
            `;
    }
    return prompt;
}
// Stop the app
crashHandler('no-crash');
process.exit(0);
