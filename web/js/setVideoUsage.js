var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mainWindowAPI } from "./mainWindowAPI.js";
import createNotification from "./notification.js";
function displayVideoUsageLimit() {
    fetch('/retrieve-video-usage-limit', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then((usageLimit) => {
        const usageIndicator = document.getElementById('usageIndicator');
        usageIndicator.classList.remove('loading-text');
        usageIndicator.innerText = `Video Usage Limit: ${usageLimit}`;
    });
}
export default function setVideoUsage() {
    const elementID = 'setVideoUsageLimit-Button';
    const videoUsageLimitBtn = document.getElementById(elementID);
    videoUsageLimitBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (localStorage.getItem('currentTab') !== 'setVideoUsage') {
            console.clear();
            // Set the current tab
            localStorage.setItem('currentTab', 'setVideoUsage');
            // Clear the main window
            mainWindowAPI.clear();
            try {
                // Add elements to main window
                const componentPath = '../components/setVideoUsage.html';
                console.log('MAIN WINDOW API CALL TO: ', componentPath);
                yield mainWindowAPI.add(componentPath);
                // Logic after page load
                setTimeout(() => {
                    displayVideoUsageLimit();
                }, 1500);
                const videoUsageInput = document.getElementById('videoUsageInput');
                console.log(videoUsageInput);
                let input;
                // Add event listener to video usage input
                console.log('EVENT LISTENER ATTACHED TO: videoUsageInput');
                const regex = /^[0-9]+$/;
                videoUsageInput.addEventListener('input', () => {
                    input = videoUsageInput.value;
                    if (!input.match(regex)) {
                        videoUsageInput.value = input.slice(0, -1);
                    }
                    console.log(input);
                });
                // Add event listener to video usage button
                const videoUsageButton = document.getElementById('videoUsageButton');
                videoUsageButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    const input = videoUsageInput.value;
                    const regex = /^[0-9]+$/;
                    if (input.match(regex)) {
                        const response = yield fetch('/settings/video-limit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ usageLimit: input })
                        });
                        if (response.ok) {
                            console.log('Sent Request');
                            displayVideoUsageLimit();
                            createNotification('Changed Video Usage Limit', true);
                        }
                        else {
                            console.error('Error sending request:', response.status, response.statusText);
                            createNotification('Changed Video Usage Limit', false);
                        }
                    }
                    else {
                        console.error('Invalid input');
                    }
                }));
            }
            catch (error) {
                console.error(error);
            }
        }
    }));
}
