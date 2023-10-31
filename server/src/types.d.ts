// Interface for the App settings
interface settings {
    videoUsageCap: number
    currentPromptFile: string
}

// Type for the theme file
type themeFile = Array<Array<string>>

// Interface for the theme file manager
type themeFileManager = {
    refresh: () => void
    getThemes: () => themeFile
    editTheme: (file: string, theme: string) => void
}