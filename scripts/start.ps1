# Define paths
$parentDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$nodePath = Join-Path -Path $parentDir -ChildPath "..\node\node.exe"
$appScript = Join-Path -Path $parentDir -ChildPath "..\server\dist\app.js"  # Replace with your actual entry point script

# Check if the server is already running
$serverRunning = Test-NetConnection -ComputerName localhost -Port 80 -InformationLevel Quiet

# If server is not running, start it
if (-Not $serverRunning) {
    Start-Process -NoNewWindow -FilePath $nodePath -ArgumentList $appScript
}

$webviewPath = Join-Path -Path $parentDir -ChildPath "..\webview\out"
Set-Location $webviewPath
Start-Process -NoNewWindow -FilePath .\webview.exe

# Minimize the PowerShell window to the system tray
try {
    Add-Type -AssemblyName System.Windows.Forms
    $notifyIcon = New-Object System.Windows.Forms.NotifyIcon
    $notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($MyInvocation.MyCommand.Path)
    $notifyIcon.Visible = $true
    $notifyIcon.Text = "PowerShell Script"
    $notifyIcon.ClickAction = {
        $notifyIcon.Visible = $false
        $form = New-Object System.Windows.Forms.Form
        $form.WindowState = 'Minimized'
        $form.ShowInTaskbar = $false
        $form.Show()
    }
} catch {
    Write-Host "Missing Binaries for System"
    Write-Host "Cannot Minimize to Tray"
}

# Keep the PowerShell window open
powershell -NoExit
