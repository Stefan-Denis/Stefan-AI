# Define paths
$nodePath = "..\node\node.exe"
$appScript = "..\server\dist\app.js"  # Replace with your actual entry point script
$browserUrl = "stefan-ai.app"  # Replace with your desired URL

# Check if the server is already running
$serverRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet

# If server is not running, start it
if (-Not $serverRunning) {
    Start-Process -NoNewWindow -FilePath $nodePath -ArgumentList $appScript
}

# Start default browser in the background with specified URL
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c start $browserUrl"

# Keep the PowerShell window open
powershell -NoExit