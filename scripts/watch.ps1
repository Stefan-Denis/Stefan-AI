# Define paths
$cmdPath = "cmd.exe"  # Path to cmd.exe
$nodemonPath = "nodemon"  # Assuming nodemon is installed globally
$appScript = "..\server\dist\app.js"  # Replace with your actual entry point script
$browserUrl = "http://localhost:32523"  # Replace with your desired URL

# Start nodemon to watch for changes and restart the server using cmd.exe
Start-Process -NoNewWindow -FilePath $cmdPath -ArgumentList "/k $nodemonPath $appScript"

# Start default browser in the background with specified URL
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c start $browserUrl"

# Keep the PowerShell window open
powershell -NoExit