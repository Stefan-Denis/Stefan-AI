localStorage.setItem('currentTab', 'home')

// Import listener functions
// Import Video Usage Script
import setVideoUsage from "./setVideoUsage.js"
setVideoUsage()

// Import Add Video Script
import addVideo from "./addVideo.js"
addVideo()

// Import Remove Video Script
import removeVideos from "./removeVideos.js"
removeVideos()

// Import View Themes Script
import viewThemes from "./viewThemes.js"
viewThemes()

// Import Edit Themes Script
import editThemes from "./editThemes.js"
editThemes()

// Import Reset Themes Script
import resetThemes from "./resetThemes.js"
resetThemes()

// Import Add GPT Key Script
import addGPTKey from "./addGPTKey.js"
addGPTKey()

// Import Add Google JSON File Script
import addGoogleJSONFile from "./addGoogleJSONFile.js"
addGoogleJSONFile()

// Import Add Profile Script
import addProfile from "./addProfile.js"
addProfile()

// Import Delete Profile Script
import deleteProfiles from "./deleteProfile.js"
deleteProfiles()

// Import Select Profile Script
import selectProfile from "./selectProfiles.js"
selectProfile()

// Import calculateVideos Script
import calculateVideos from "./calculateVideos.js"
calculateVideos()

// Begin Production
import main from "./beginProduction.js"
main()