import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

function displayVideoUsageLimit() {
    fetch('/retrieve-video-usage-limit', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then((usageLimit) => {
            const usageIndicator = document.getElementById('usageIndicator')!
            usageIndicator.classList.remove('loading-text')
            usageIndicator.innerText = `Video Usage Limit: ${usageLimit}`
        })
}

export default function setVideoUsage() {
    const elementID = 'setVideoUsageLimit-Button'
    const videoUsageLimitBtn = document.getElementById(elementID)!

    videoUsageLimitBtn.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'setVideoUsage') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'setVideoUsage')

            // Clear the main window
            mainWindowAPI.clear()

            try {
                // Add elements to main window
                const componentPath = '../components/setVideoUsage.html'
                console.log('MAIN WINDOW API CALL TO: ', componentPath)
                await mainWindowAPI.add(componentPath)

                // Logic after page load
                setTimeout(() => {
                    displayVideoUsageLimit()
                }, 1500)

                const videoUsageInput = document.getElementById('videoUsageInput') as HTMLInputElement
                console.log(videoUsageInput)

                let input: string

                // Add event listener to video usage input
                console.log('EVENT LISTENER ATTACHED TO: videoUsageInput')
                const regex = /^[0-9]+$/
                videoUsageInput.addEventListener('input', () => {
                    input = videoUsageInput.value

                    if (!input.match(regex)) {
                        videoUsageInput.value = input.slice(0, -1)
                    }

                    console.log(input)
                })

                // Add event listener to video usage button
                const videoUsageButton = document.getElementById('videoUsageButton')!
                videoUsageButton.addEventListener('click', async () => {
                    const input = videoUsageInput.value
                    const regex = /^[0-9]+$/

                    if (input.match(regex)) {
                        const response = await fetch('/settings/video-limit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ usageLimit: input })
                        })

                        if (response.ok) {
                            console.log('Sent Request')
                            displayVideoUsageLimit()
                            createNotification('Changed Video Usage Limit', true)
                        } else {
                            console.error('Error sending request:', response.status, response.statusText)
                            createNotification('Changed Video Usage Limit', false)
                        }
                    } else {
                        console.error('Invalid input')
                    }
                })

            } catch (error) {
                console.error(error)
            }
        }
    })
}