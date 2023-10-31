import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

export default function removeVideos() {
    const elementID = 'removeVideos-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'removeVideo') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'removeVideo')

            // Clear the main window
            mainWindowAPI.clear()

            try {
                const componentPath = '../components/removeVideos.html'
                console.log('MAIN WINDOW API CALL TO: ', componentPath)
                await mainWindowAPI.add(componentPath)

                let videos: Array<string> = []

                await fetch('/videos', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                    .then(res => res.json())
                    .then(data => videos = data)

                const videosTable = document.getElementById('videos-table')!

                videos.forEach((video: string) => {
                    const row = document.createElement('tr')
                    const titleCell = document.createElement('td')
                    titleCell.textContent = video
                    const viewCell = document.createElement('td')
                    const viewButton = document.createElement('button')
                    viewButton.classList.add('btn', 'btn-link')
                    viewButton.textContent = 'View'
                    viewButton.addEventListener('click', async () => {
                        // handle view button click for this video

                        const response = await fetch(`/videos/view`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ video })
                        })

                        const blob = await response.blob()
                        const videoUrl = URL.createObjectURL(blob)
                        const videoPlayer = document.createElement('video')
                        videoPlayer.src = videoUrl
                        videoPlayer.controls = true
                        videoPlayer.style.maxHeight = '70vh' // Set the max-height of the video player to 70% of the viewport height

                        // Create the modal popup
                        const modal = document.createElement('div')
                        modal.classList.add('modal', 'fade')
                        modal.setAttribute('tabindex', '-1')
                        modal.setAttribute('role', 'dialog')
                        modal.setAttribute('aria-labelledby', 'videoModalLabel')
                        modal.setAttribute('aria-hidden', 'true')

                        const modalDialog = document.createElement('div')
                        modalDialog.classList.add('modal-dialog', 'modal-lg', 'modal-dialog-scrollable')
                        modalDialog.setAttribute('role', 'document')
                        modalDialog.style.width = 'auto'

                        const modalContent = document.createElement('div')
                        modalContent.classList.add('modal-content')

                        const modalHeader = document.createElement('div')
                        modalHeader.classList.add('modal-header')

                        const modalTitle = document.createElement('h5')
                        modalTitle.classList.add('modal-title')
                        modalTitle.setAttribute('id', 'videoModalLabel')
                        modalTitle.textContent = video

                        const closeButton = document.createElement('button')
                        closeButton.classList.add('close')
                        closeButton.setAttribute('type', 'button')
                        closeButton.setAttribute('data-dismiss', 'modal')
                        closeButton.setAttribute('aria-label', 'Close')
                        closeButton.addEventListener('click', () => {
                            // Remove the modal from the DOM when the close button is clicked
                            modal.remove()
                        })

                        const closeIcon = document.createElement('span')
                        closeIcon.setAttribute('aria-hidden', 'true')
                        closeIcon.innerHTML = '&times;'

                        closeButton.appendChild(closeIcon)
                        modalHeader.appendChild(modalTitle)
                        modalHeader.appendChild(closeButton)

                        const modalBody = document.createElement('div')
                        modalBody.classList.add('modal-body')
                        modalBody.style.textAlign = 'center' // Center the video in the modal
                        modalBody.appendChild(videoPlayer)

                        modalContent.appendChild(modalHeader)
                        modalContent.appendChild(modalBody)

                        modalDialog.appendChild(modalContent)

                        modal.appendChild(modalDialog)

                        document.body.appendChild(modal)

                        modal.classList.add('show')
                        modal.style.display = 'block'
                        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)' // Set the background color to a darker shade
                        modalDialog.style.margin = '10vh auto' // Center the modal vertically and horizontally
                    })
                    viewCell.appendChild(viewButton)
                    const deleteCell = document.createElement('td')
                    const deleteButton = document.createElement('button')
                    deleteButton.classList.add('btn', 'btn-danger')
                    deleteButton.textContent = 'Delete'
                    deleteButton.addEventListener('click', () => {
                        // handle delete button click for this video
                        fetch(`/videos/delete`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ video })
                        })
                            .then(res => {
                                if (res.status === 200) {
                                    console.log('Video deleted successfully!')
                                    createNotification('Video deleted successfully', true)
                                    if (!row.parentNode) {
                                        return
                                    }
                                    row.remove()
                                } else {
                                    console.error('Error deleting video.')
                                    createNotification('Error deleting video', false)
                                }
                            })
                    })
                    deleteCell.appendChild(deleteButton)
                    row.appendChild(titleCell)
                    row.appendChild(viewCell)
                    row.appendChild(deleteCell)
                    videosTable.appendChild(row)
                })

                // Change display for the main window
                setTimeout(() => {
                    document.getElementById('main-stylesheet')?.setAttribute('href', 'css/style-nogrid.css')
                }, 3)
            } catch (error) {
                console.error(error)
            }
        }
    })
}
