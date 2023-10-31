import { mainWindowAPI } from "./mainWindowAPI.js"
import createNotification from "./notification.js"

export default function deleteProfiles() {
    const elementID = 'deleteProfiles-button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'deleteProfiles') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'deleteProfiles')

            // Clear the main window
            mainWindowAPI.clear()

            // Add elements to main window
            const componentPath = '../components/deleteProfiles.html'
            console.log('MAIN WINDOW API CALL TO: ', componentPath)
            await mainWindowAPI.add(componentPath)

            fetch('/profiles')
                .then((response) => response.json())
                .then((data: Array<string>) => {
                    console.log(data)
                    const dropdown = document.getElementById('dropdown-deleteProfiles')
                    if (dropdown) {
                        let dropdownItems = []
                        for (let i = 0; i < data.length; i++) {
                            dropdownItems.push(`<li><a class="dropdown-item" data-id="${data[i]}">${data[i]}</a></li>`)
                        }
                        dropdown.innerHTML = dropdownItems.join('')
                        dropdown.addEventListener('click', (event) => {
                            const target = event.target as HTMLElement
                            const id = target.dataset.id
                            document.getElementById('selectedProfile-todelete')!.innerHTML = id!

                            document.getElementById('deleteProfileBtn')!.addEventListener('click', () => {
                                fetch('/profile/delete', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        profileName: id
                                    })
                                })
                                    .then((response) => {
                                        console.log(response)
                                        if (response.ok) {
                                            console.log(`Profile ${id} deleted!`)
                                            createNotification(`Profile ${id} deleted!`, true)
                                        } else {
                                            console.error(`Profile ${id} could not be deleted!`)
                                            createNotification(`Profile ${id} could not be deleted!`, false)
                                        }

                                        document.getElementById('selectedProfile-todelete')!.innerHTML = ''
                                    })
                                    .catch(error => {
                                        console.error(error)
                                        createNotification(`Profile ${id} could not be deleted!`, false)
                                    })
                            })
                        })
                    }
                })
        } else {
            console.error('Dropdown element not found')
        }
    })
}