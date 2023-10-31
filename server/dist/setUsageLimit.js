// Node.js Libraries
import path from 'path';
import fs from 'fs-extra';
// __dirname
const currentModuleUrl = new URL(import.meta.url);
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
// Main Function
export default function setUsageLimit(usageLimit) {
    const settingsFilePath = path.join(__dirname, '../', 'config', 'settings.json');
    const settingsFileData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    settingsFileData.videoUsageCap = usageLimit;
    fs.writeFileSync(settingsFilePath, JSON.stringify(settingsFileData, null, 4));
}
