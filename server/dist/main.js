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
const crashStatus = _crashStatus === 'true' ? true : false;
console.log(crashStatus);
console.log(typeof crashStatus);
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
const profileSettings = _profileSettings;
// Create new combinations only if the app did not crash.
if (!crashStatus) {
    let permutations = [];
    const videoPath = path.join(__dirname, '../', 'videos');
    const files = fs.readdirSync(videoPath).filter(file => path.extname(file) === '.mp4');
    const len = files.length;
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len; j++) {
            for (let k = 0; k < len; k++) {
                if (i !== j && j !== k && k !== i) {
                    permutations.push([files[i], files[j], files[k], false]);
                }
            }
        }
    }
    const combinationsFilePath = path.join(__dirname, '../', 'config', 'combinations.json');
    fs.writeFileSync(combinationsFilePath, JSON.stringify(permutations, null, 4));
}
else {
    console.log('false');
}
// Stop the app
crashHandler('no-crash');
process.exit(0);
