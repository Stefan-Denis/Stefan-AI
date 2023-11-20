Clear-Host

# Specify the directory you want to add to the PATH
$ffmpegPath = Join-Path -Path (Resolve-Path -Path "../server/modules").Path -ChildPath "ffmpeg"

# Get the current PATH variable
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::Machine)

# Check if the directory is not already in the PATH
if ($currentPath -notlike "*$ffmpegPath*") {
    # Append the directory to the PATH with a semicolon as a separator
    [System.Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ffmpegPath", [System.EnvironmentVariableTarget]::Machine)

    # Display a message indicating success
    Write-Host "Directory added to PATH. Changes will take effect in new sessions."
}
else {
    # Display a message indicating that the directory is already in the PATH
    Write-Host "Directory is already in PATH."
}

Write-Host " "


# Start installers
Start-Process -FilePath ".\python-download.exe" -Wait
Start-Process -FilePath ".\VisualStudioSetup.exe" -Wait
Start-Process -FilePath ".\miniconda.exe" -Wait