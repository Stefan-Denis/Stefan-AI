// Downloaded Libraries
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import multer from 'multer';
// Node.js Libraries
import path from 'path';
import { spawnSync } from 'child_process';
// Custom Libraries
import getUsageLimit from './getUsageLimit.js';
import setUsageLimit from './setUsageLimit.js';
import checkVideoDimensions from './checkVideoDimensions.js';
import { themeFile } from './themeFileManager.js';
import calculateAllCombinations from './estimate.js';
// __dirname
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
// Initial Load
console.clear();
console.log('\x1b[32m%s\x1b[0m', 'App Terminal Started!');
console.log('\x1b[31m%s\x1b[0m', 'DO NOT CLOSE THIS WINDOW!');
// Express
const app = express();
export default app;
app.use(express.static(path.join(__dirname, '../', '../', 'web')));
app.use(bodyParser.urlencoded({ extended: true, limit: '0' }));
app.use(bodyParser.json());
app.get('', (req, res) => {
    res.sendFile(path.join(__dirname, '../', '../', 'web', 'mainpage.html'));
});
// ^ USAGE LIMIT
// Set video usage limit
app.post('/settings/video-limit', (req, res) => {
    const usageLimit = Number(req.body.usageLimit);
    setUsageLimit(usageLimit);
    res.sendStatus(200);
});
// Retrieve video usage limit
app.get('/retrieve-video-usage-limit', (req, res) => {
    const usageLimit = getUsageLimit();
    res.send(JSON.stringify(usageLimit));
});
// ^ VIDEOS
// Retrieve video list
app.get('/videos', (req, res) => {
    const videos = fs.readdirSync(path.join(__dirname, '../', 'videos'));
    res.send(JSON.stringify(videos));
});
// Upload Videos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../', 'videos'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });
app.post('/videos/add', upload.array('videos'), async (req, res) => {
    try {
        const badFiles = [];
        const promises = req.files.map(async (file) => {
            const isGood = await checkVideoDimensions(file);
            if (!isGood) {
                badFiles.push(file.originalname);
            }
        });
        await Promise.all(promises);
        if (badFiles.length > 0) {
            console.log(`The following files are not 1080x1920: ${badFiles.join(', ')}`);
            res.status(207).send(JSON.stringify(badFiles));
        }
        else {
            console.log(`All files are 1080x1920.`);
            res.sendStatus(200);
        }
    }
    finally {
        // Refresh theme file
        themeFile.refresh();
    }
});
// View Videos
app.post('/videos/view', (req, res) => {
    const videoPath = path.join(__dirname, '../', 'videos', req.body.video);
    res.sendFile(videoPath);
});
// Delete Videos
app.post('/videos/delete', (req, res) => {
    try {
        const videoName = req.body.video;
        const videoPath = path.join(__dirname, '../', 'videos', videoName);
        fs.unlinkSync(videoPath);
        res.sendStatus(200);
    }
    finally {
        // Refresh theme file
        themeFile.refresh();
    }
});
// ^ THEME MANAGEMENT
// View themes
app.get('/themes', (req, res) => {
    const themes = themeFile.getThemes();
    res.send(JSON.stringify(themes));
});
// Edit themes
app.post('/themes/edit', (req, res) => {
    const theme = req.body.theme;
    const file = req.body.file;
    themeFile.editTheme(file, theme);
    res.sendStatus(200);
});
// Reset themes
app.get('/themes/reset', (req, res) => {
    themeFile.refresh();
    res.sendStatus(200);
});
// ^ API MANAGEMENT
// Add GPT Key
app.post('/settings/gpt-key', (req, res) => {
    const key = req.body.key;
    const data = `GPT_KEY=${key}\nGOOGLE_APPLICATION_CREDENTIALS="../config/google.json"`;
    fs.writeFileSync(path.join(__dirname, '../', 'config', '.env'), data);
    res.sendStatus(200);
});
// Add Google JSON File
const secondaryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../', 'config'));
    },
    filename: function (req, file, cb) {
        cb(null, 'google.json');
    }
});
const secondaryUpload = multer({ storage: secondaryStorage });
app.post('/settings/google-json-file', secondaryUpload.array('googleJSONFile'), (req, res) => {
    res.sendStatus(200);
});
// ^ PROFILE MANAGEMENT
// Add Profile Files
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../', 'profiles'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const profileUpload = multer({ storage: profileStorage });
app.post('/profile/add', profileUpload.array('profile'), (req, res) => {
    res.sendStatus(200);
});
// Delete Profiles
app.get('/profiles', (req, res) => {
    const profiles = fs.readdirSync(path.join(__dirname, '../', 'profiles'));
    const jsoncFiles = profiles.filter(file => file.endsWith('.jsonc'));
    res.send(JSON.stringify(jsoncFiles));
});
app.post('/profile/delete', (req, res) => {
    const profileName = req.body.profileName;
    const profilePath = path.join(__dirname, '../', 'profiles', profileName);
    fs.unlinkSync(profilePath);
    res.sendStatus(200);
});
// Select Profile
app.get('/profiles/current', (req, res) => {
    // find the current profile from main.txt
    const currentProfile = fs.readFileSync(path.join(__dirname, '../', 'profiles', 'main.txt'), 'utf-8');
    res.send(JSON.stringify(currentProfile));
});
app.get('/profiles/all', (req, res) => {
    const profiles = fs.readdirSync(path.join(__dirname, '../', 'profiles'));
    const jsoncFiles = profiles.filter(file => file.endsWith('.jsonc'));
    res.send(JSON.stringify(jsoncFiles));
});
app.post('/profiles/equip', (req, res) => {
    fs.writeFileSync(path.join(__dirname, '../', 'profiles', 'main.txt'), req.body.profileName);
    res.sendStatus(200);
});
// ^ Calculate Videos
app.post('/calculate-videos', (req, res) => {
    const maxVideoUsageInput = parseInt(req.body.maxVideoUsageInput);
    const videosPerArrayInput = parseInt(req.body.videosPerArrayInput);
    // Files data
    const videoPath = path.join(__dirname, '../', 'videos');
    const files = fs.readdirSync(videoPath).filter(file => path.extname(file) === '.mp4');
    res.status(200).send({ maxCombinations: calculateAllCombinations(maxVideoUsageInput, videosPerArrayInput, files.length) });
});
//! MAIN PRODUCTION
app.get('/start', (req, res) => {
    function callScript() {
        const scriptPath = path.join(__dirname, '../', 'cli', 'init.ps1');
        const result = spawnSync('powershell.exe', [scriptPath], { cwd: path.dirname(scriptPath) });
        if (result.status === 2) {
            callScript();
        }
        else if (result.status !== 0) {
            res.status(500).send(result.stderr.toString());
        }
        else {
            res.sendStatus(200);
        }
    }
    callScript();
});
app.listen(80, '127.0.0.1');
