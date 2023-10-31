import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

export default function addGPTKey() {
    const elementID = 'addGPTKey-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'addGPTKey') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'addGPTKey')

            // Clear the main window
            mainWindowAPI.clear()

            // Add elements to main window
            const componentPath = '../components/addGPTKey.html'
            console.log('MAIN WINDOW API CALL TO: ', componentPath)
            await mainWindowAPI.add(componentPath)

            const confirmButton = document.getElementById('confirm-addGPTKey')! as HTMLButtonElement
            const input = document.getElementById('addGPTKey-input')! as HTMLInputElement

            confirmButton.addEventListener('click', () => {
                const key = input.value

                fetch('/settings/gpt-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ key })
                })
                    .then((response) => {
                        if (response.status === 200) {
                            createNotification('Successfully added GPT Key!', true)
                        } else {
                            createNotification('Error adding GPT Key!', false)
                        }

                        setTimeout(() => {
                            window.location.reload()
                        }, 3800)
                    })
            })
        }
    })
}