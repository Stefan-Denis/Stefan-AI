var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
// __dirname
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
const ffprobe = path.join(__dirname, '../', 'modules', 'ffprobe.exe');
export default function checkVideoDimensions(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPath = path.join(__dirname, '../', 'videos', file.originalname);
        console.log(`Checking dimensions of ${videoPath}...`);
        const ffprobeProcess = spawn(ffprobe, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', videoPath]);
        const stdoutChunks = [];
        ffprobeProcess.stdout.on('data', (chunk) => {
            stdoutChunks.push(chunk);
        });
        yield new Promise((resolve) => {
            ffprobeProcess.on('close', resolve);
        });
        const stdout = Buffer.concat(stdoutChunks).toString();
        console.log(`Output of ffprobe for ${videoPath}: ${stdout}`);
        const { streams } = JSON.parse(stdout);
        const videoStream = streams.find((stream) => stream.width === 1080 && stream.height === 1920);
        if (!videoStream) {
            console.log(`${videoPath} is not 1080x1920. Deleting...`);
            yield fs.unlink(videoPath);
            return false;
        }
        else {
            console.log(`${videoPath} is 1080x1920. Keeping...`);
            return true;
        }
    });
}
