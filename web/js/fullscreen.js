// Make it work through node.js
export default function fullscreenListener() {
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    fullscreenToggle.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        else {
            document.documentElement.requestFullscreen();
        }
    });
}
