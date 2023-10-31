// Make it work through node.js
export default function closeListener() {
    const closeAppButton = document.getElementById('closeApp');
    closeAppButton.addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to close the app?');
        if (confirmed) {
            window.close();
        }
    });
}
