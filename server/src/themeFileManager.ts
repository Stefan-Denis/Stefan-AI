// Downloaded modules
import fs from 'fs-extra'

// Node.js Libraries
import path from 'path'

// __dirname
const currentModuleUrl = new URL(import.meta.url)
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1)

export const themeFile: themeFileManager = {
    refresh: () => {
        const themeFilePath = path.join(__dirname, '../', 'config', 'theme.json')
        const videos = fs.readdirSync(path.join(__dirname, '../', 'videos'))
        const themeFileContents: themeFile = []

        videos.forEach((video) => {
            themeFileContents.push([video, ''])
        })

        fs.writeFileSync(themeFilePath, JSON.stringify(themeFileContents, null, 4))
    },

    getThemes: () => {
        const themeFilePath = path.join(__dirname, '../', 'config', 'theme.json')
        const themeFileContents = fs.readFileSync(themeFilePath, 'utf8')
        return JSON.parse(themeFileContents)
    },

    editTheme: (file: string, theme: string) => {
        const themeFilePath = path.join(__dirname, '../', 'config', 'theme.json')
        const themeFileContents = fs.readFileSync(themeFilePath, 'utf8')
        const themeFileContentsJSON = JSON.parse(themeFileContents)
        const index = themeFileContentsJSON.findIndex((element: Array<string>) => {
            return element[0] === file
        })
        themeFileContentsJSON[index][1] = theme
        fs.writeFileSync(themeFilePath, JSON.stringify(themeFileContentsJSON, null, 4))
    }
}