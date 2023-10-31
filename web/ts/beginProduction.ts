import createNotification from "./notification.js"

export default function main() {
    const elementID = 'start'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        createNotification('Starting Production!', true)
        fetch('/start')
    })
}