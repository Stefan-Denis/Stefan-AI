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
export default function editThemes() {
    const elementID = 'editThemes-Button';
    const element = document.getElementById(elementID);
    element.addEventListener('click', () => {
        if (localStorage.getItem('currentTab') !== 'editThemes') {
            console.clear();
            // Set the current tab
            localStorage.setItem('currentTab', 'editThemes');
            // Clear the main window
            mainWindowAPI.clear();
            // Add elements to main window
            const componentPath = '../components/editThemes.html';
            console.log('MAIN WINDOW API CALL TO: ', componentPath);
            mainWindowAPI.add(componentPath);
            // Retrieve video + themes from /themes and append to id="dropdown-themeeditor"
            fetch('/themes')
                .then((response) => response.json())
                .then((data) => {
                console.log(data);
                const dropdown = document.getElementById('dropdown-themeeditor');
                let dropdownItems = [];
                for (let i = 0; i < data.length; i++) {
                    dropdownItems.push(`<li><a class="dropdown-item" data-id="${data[i][0]}">${data[i][0]}</a></li>`);
                }
                dropdown.innerHTML = dropdownItems.join('');
                dropdown.addEventListener('click', (event) => {
                    const target = event.target;
                    const id = target.dataset.id;
                    console.log(`Selected video: ${id}`);
                    editVideoThemeProcess(id);
                });
            })
                .catch(error => console.error(error));
        }
    });
}
function editVideoThemeProcess(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        console.clear();
        // Clear the main window
        mainWindowAPI.clear();
        // Set the page
        localStorage.setItem('currentTab', 'editThemesEditor');
        // Add elements to main window
        const componentPath = '../components/editThemesEditor.html';
        console.log('MAIN WINDOW API CALL TO: ', componentPath);
        yield mainWindowAPI.add(componentPath);
        const editor = document.getElementById('themeEditor');
        let input;
        editor.addEventListener('input', () => {
            input = editor.value;
        });
        document.getElementById('submitVideoTheme').addEventListener('click', () => {
            fetch('/themes/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file: filename,
                    theme: input
                })
            })
                .then((response) => {
                if (response.status === 200) {
                    createNotification('Updated Video Theme', true);
                }
                else {
                    createNotification('An error has occoured, make sure you click on an actual element!', false);
                }
                setTimeout(() => {
                    document.getElementById('editThemes-Button').click();
                }, 2500);
            });
        });
    });
}
