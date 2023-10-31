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
export default function selectedProfile() {
    const elementID = 'selectedProfile-button';
    const element = document.getElementById(elementID);
    element.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (localStorage.getItem('currentTab') !== 'selectedProfile') {
            console.clear();
            // Set the current tab
            localStorage.setItem('currentTab', 'selectedProfile');
            // Clear the main window
            mainWindowAPI.clear();
            // Add elements to main window
            const componentPath = '../components/selectProfiles.html';
            console.log('MAIN WINDOW API CALL TO: ', componentPath);
            yield mainWindowAPI.add(componentPath);
            fetch('/profiles/current')
                .then(response => response.json())
                .then(data => {
                document.getElementById('selectedProfile-equipped').innerHTML = JSON.stringify(data);
            });
            fetch('/profiles/all')
                .then((response) => response.json())
                .then((data) => {
                const dropdown = document.getElementById('selectedProfile-toequip');
                if (dropdown) {
                    let dropdownItems = [];
                    for (let i = 0; i < data.length; i++) {
                        dropdownItems.push(`<li><a class="dropdown-item" data-id="${data[i]}">${data[i]}</a></li>`);
                    }
                    dropdown.innerHTML = dropdownItems.join('');
                    dropdown.addEventListener('click', (event) => {
                        const target = event.target;
                        const id = target.dataset.id;
                        document.getElementById('selectedProfile-nowSelected').innerHTML = id;
                        document.getElementById('selectProfileBtn').addEventListener('click', () => {
                            fetch('/profiles/equip', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    profileName: id
                                })
                            })
                                .then((response) => {
                                console.log(response);
                                if (response.ok) {
                                    console.log(`Profile ${id} equipped!`);
                                    createNotification(`Profile ${id} equipped!`, true);
                                }
                                else {
                                    console.error(`Profile ${id} could not be equipped!`);
                                    createNotification(`Profile ${id} could not be equipped!`, false);
                                }
                            });
                        });
                    });
                }
            });
        }
    }));
}
