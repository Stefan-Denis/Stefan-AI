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
export default function addGPTKey() {
    const elementID = 'addGPTKey-Button';
    const element = document.getElementById(elementID);
    element.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (localStorage.getItem('currentTab') !== 'addGPTKey') {
            console.clear();
            // Set the current tab
            localStorage.setItem('currentTab', 'addGPTKey');
            // Clear the main window
            mainWindowAPI.clear();
            // Add elements to main window
            const componentPath = '../components/addGPTKey.html';
            console.log('MAIN WINDOW API CALL TO: ', componentPath);
            yield mainWindowAPI.add(componentPath);
            const confirmButton = document.getElementById('confirm-addGPTKey');
            const input = document.getElementById('addGPTKey-input');
            confirmButton.addEventListener('click', () => {
                const key = input.value;
                fetch('/settings/gpt-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ key })
                })
                    .then((response) => {
                    if (response.status === 200) {
                        createNotification('Successfully added GPT Key!', true);
                    }
                    else {
                        createNotification('Error adding GPT Key!', false);
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 3800);
                });
            });
        }
    }));
}
