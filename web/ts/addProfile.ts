import createNotification from "./notification.js"

export default function addProfile() {
    const elementID = 'addProfile-button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', () => {
        // Open a file dialog automatically for the user to select a .jsonc file
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.jsonc'
        input.click()

        // Make it so after the submission, it creates a fetch response sending just that single file
        input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement
            const file = target.files![0]

            const formData = new FormData()
            formData.append('profile', file)

            fetch('/profile/add', {
                method: 'POST',
                body: formData
            })
                .then((response) => {
                    if (response.status === 200) {
                        createNotification('Successfully added profile!', true)
                    } else {
                        createNotification('Error adding profile!', false)
                    }
                })
        })
    })
}