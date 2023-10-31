// Downloaded Libraries
import fs from 'fs-extra'

// Node.js Libraries
import path from 'path'

// __dirname
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

// Main Function
export default function getUsageLimit() {
    const settingsFilePath = path.join(__dirname, '../', 'config', 'settings.json')
    const settingsFileData: settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'))
    return settingsFileData.videoUsageCap
}