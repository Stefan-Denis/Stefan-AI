import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

export default function resetThemes() {
    const elementID = 'resetThemes-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'resetThemes') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'resetThemes')

            // Clear the main window
            mainWindowAPI.clear()

            // Add elements to main window
            const componentPath = '../components/resetThemes.html'
            console.log('MAIN WINDOW API CALL TO: ', componentPath)
            await mainWindowAPI.add(componentPath)

            const confirmButton = document.getElementById('confirm-deleteThemes')!
            const rejectButton = document.getElementById('reject-deleteThemes')!

            confirmButton.addEventListener('click', () => {
                rejectButton.removeEventListener('click', () => true)

                fetch('/themes/reset')
                    .then((response) => {
                        if (response.status === 200) {
                            createNotification('Successfully reset themes!', true)
                        } else {
                            createNotification('Error resetting themes!', false)
                        }

                        setTimeout(() => {
                            window.location.reload()
                        }, 3800)
                    })
            })

            rejectButton.addEventListener('click', () => {
                confirmButton.removeEventListener('click', () => true)

                createNotification('Reset Process cancelled.', false)

                setTimeout(() => {
                    window.location.reload()
                }, 3800)
            })
        }
    })
}