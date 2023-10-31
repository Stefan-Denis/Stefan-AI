import { mainWindowAPI } from "./mainWindowAPI.js";
export default function viewThemes() {
    const elementID = 'viewThemes-Button';
    const element = document.getElementById(elementID);
    element.addEventListener('click', () => {
        if (localStorage.getItem('currentTab') !== 'viewThemes') {
            console.clear();
            // Clear the main window
            mainWindowAPI.clear();
            // Add elements to main window
            const componentPath = '../components/viewThemes.html';
            console.log('MAIN WINDOW API CALL TO: ', componentPath);
            mainWindowAPI.add(componentPath);
            // Set the current tab
            localStorage.setItem('currentTab', 'viewThemes');
            fetch('/themes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then((themes) => {
                setTimeout(() => {
                    document.getElementById('viewThemes-loader').remove();
                    const videoThemesMain = document.getElementById('videoThemes-main');
                    themes.forEach((theme) => {
                        const filename = theme[0];
                        const themeName = theme[1];
                        const card = document.createElement('div');
                        card.classList.add('card');
                        const cardBody = document.createElement('div');
                        cardBody.classList.add('card-body');
                        const cardTitle = document.createElement('h5');
                        cardTitle.classList.add('card-title');
                        cardTitle.textContent = filename;
                        const cardText = document.createElement('p');
                        cardText.classList.add('card-text');
                        cardText.textContent = `Theme: ${themeName}`;
                        cardBody.appendChild(cardTitle);
                        cardBody.appendChild(cardText);
                        card.appendChild(cardBody);
                        videoThemesMain.append(card);
                        card.style.marginBottom = '10px';
                    });
                }, 500);
            });
            // Change display for the main window
            setTimeout(() => {
                document.getElementById('main-stylesheet').setAttribute('href', 'css/style-nogrid.css');
            }, 2);
        }
    });
}
