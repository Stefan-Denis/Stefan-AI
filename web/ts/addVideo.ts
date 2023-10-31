import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

export default function addVideo() {
    const elementID = 'addVideo-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'addVideo') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'addVideo')

            // Clear the main window
            mainWindowAPI.clear()

            try {
                const componentPath = '../components/addVideo.html'
                console.log('MAIN WINDOW API CALL TO: ', componentPath)
                await mainWindowAPI.add(componentPath)

                document.getElementById('labelToBeRemoved-addVideo')!.remove()

                const fileInput = document.getElementById('video')! as HTMLInputElement
                const form = document.getElementById('addVideoForm') as HTMLFormElement
                form.addEventListener('submit', async (event) => {
                    event.preventDefault()

                    const files = fileInput.files
                    if (!files || files.length === 0) {
                        console.error('No files selected.')
                        return
                    }

                    const formData = new FormData()
                    for (let i = 0; i < files.length; i++) {
                        formData.append('videos', files[i])
                    }

                    const xhr = new XMLHttpRequest()
                    xhr.open('POST', '/videos/add')
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            console.log('Files uploaded successfully!')
                            createNotification('Files uploaded successfully', true)
                        } else if (xhr.status === 207) {
                            console.error('Error uploading files.')
                            const badFiles = JSON.parse(xhr.responseText)
                            createNotification(`Some files didn't meet the standard: ${badFiles.join(', ')}`, false)
                        } else {
                            console.error('Error uploading files.')
                            createNotification('Error uploading files', false)
                        }
                    }
                    xhr.send(formData)
                })
            } catch (error) {
                console.error(error)
            }
        }
    })
}