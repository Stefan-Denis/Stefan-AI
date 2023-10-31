# Define the custom domain and IP address
$customDomain = "stefan-ai.app"
$ipAddress = "127.0.0.1"

# Add an entry to the hosts file
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "$ipAddress $customDomain"

Write-Host "Custom domain '$customDomain' mapped to '$ipAddress' in hosts file."
Pause