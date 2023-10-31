let isNotificationPlaying = false
const notificationQueue: { message: string, isSuccess: boolean }[] = []

export default function createNotification(message: string, isSuccess: boolean): void {
    if (notificationQueue.length >= 3) {
        return
    }
    notificationQueue.push({ message, isSuccess })
    playNotification()
}

function playNotification(): void {
    if (isNotificationPlaying || notificationQueue.length === 0) {
        return
    }
    isNotificationPlaying = true
    const { message, isSuccess } = notificationQueue.shift()!
    // Create a div element to hold the notification
    const notification = document.createElement('div')

    // Create a p element to hold the notification date
    const date = document.createElement('p')
    date.id = 'notification-date'
    date.textContent = new Date().toLocaleTimeString()

    // Create a p element to hold the notification content
    const content = document.createElement('p')
    content.id = 'notification-content'
    content.textContent = message

    // Add the date and content to the notification div
    notification.appendChild(date)
    notification.appendChild(content)

    // Set the notification's class
    notification.classList.add('notification')

    // Make this code have a pop up animation and out animation
    notification.classList.add('pop-up-animation')

    // Add the notification to the document body
    document.body.appendChild(notification)

    // Play notification sound from "../audio/notification.mp3"
    const notificationSound = new Audio(isSuccess ? '../audio/success.mp3' : '../audio/error.mp3')
    notificationSound.currentTime = isSuccess ? 0.3 : 0
    notificationSound.play()

    // Make a background animation for body to appear, make a color gradient
    document.body.classList.add(isSuccess ? 'success-background-animation' : 'error-background-animation')

    // Set a timeout to remove the notification after 3 seconds
    setTimeout(() => {
        closeNotification(notification, isSuccess)
    }, 3000)
}

function closeNotification(notification: HTMLElement, isSuccess: boolean): void {
    // Make this code have a pop up animation and out animation
    notification.classList.add('pop-out-animation')
    notification.addEventListener('animationend', () => {
        notification.remove()
        isNotificationPlaying = false
        playNotification()
    })
    document.body.classList.remove(isSuccess ? 'success-background-animation' : 'error-background-animation')
}
