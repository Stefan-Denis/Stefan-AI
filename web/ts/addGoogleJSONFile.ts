import createNotification from "./notification.js"

export default function addGoogleJSONFile() {
    const elementID = 'addGoogleJSONFile-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', () => {
        // Open a file dialog automatically for the user to select a .json file
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.click()

        // Make it so after the submission, it creates a fetch response sending just that single file
        input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement
            const file = target.files![0]

            const formData = new FormData()
            formData.append('googleJSONFile', file)

            fetch('/settings/google-json-file', {
                method: 'POST',
                body: formData
            })
                .then((response) => {
                    if (response.status === 200) {
                        createNotification('Successfully added Google JSON File!', true)
                    } else {
                        createNotification('Error adding Google JSON File!', false)
                    }
                })
        })
    })
}