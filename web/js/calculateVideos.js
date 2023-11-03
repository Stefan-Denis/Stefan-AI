var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mainWindowAPI } from './mainWindowAPI.js';
export default function calculateVideos() {
    const elementID = 'calculateVideos-Button';
    const element = document.getElementById(elementID);
    element.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (localStorage.getItem('currentTab') !== 'calculateVideos') {
            console.clear();
            // Set the current tab
            localStorage.setItem('currentTab', 'calculateVideos');
            // Clear the main window
            mainWindowAPI.clear();
            try {
                const componentPath = '../components/calculateVideos.html';
                console.log('MAIN WINDOW API CALL TO: ', componentPath);
                yield mainWindowAPI.add(componentPath);
                function addInput1(value) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const input1 = document.getElementById('input1');
                        input1.value = value;
                        maxVideoUsageValue = input1.value;
                        if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                            const response = yield fetch('/calculate-videos', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    maxVideoUsageInput: maxVideoUsageValue,
                                    videosPerArrayInput: videosPerArrayValue,
                                })
                            });
                            if (response.ok) {
                                const data = yield response.json();
                                resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`;
                            }
                        }
                    });
                }
                function addInput2(value) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const input2 = document.getElementById('input2');
                        input2.value = value;
                        videosPerArrayValue = input2.value;
                        if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                            const response = yield fetch('/calculate-videos', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    maxVideoUsageInput: maxVideoUsageValue,
                                    videosPerArrayInput: videosPerArrayValue,
                                })
                            });
                            if (response.ok) {
                                const data = yield response.json();
                                resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`;
                            }
                        }
                    });
                }
                for (let x = 1; x <= 9; x++) {
                    document.getElementById(`input1-btn-${x}`).addEventListener('click', () => {
                        addInput1(`${x}`);
                    });
                }
                for (let x = 1; x <= 9; x++) {
                    document.getElementById(`input2-btn-${x}`).addEventListener('click', () => {
                        addInput2(`${x}`);
                    });
                }
                const maxVideoUsageInput = document.getElementById('input2');
                const videosPerArrayInput = document.getElementById('input2');
                const resultElement = document.getElementById('output-numberOfCombinations');
                const regex = /^[0-9]+$/;
                let maxVideoUsageValue = '';
                maxVideoUsageInput.addEventListener('input', () => __awaiter(this, void 0, void 0, function* () {
                    maxVideoUsageValue = maxVideoUsageInput.value;
                    if (!maxVideoUsageValue.match(regex)) {
                        maxVideoUsageInput.value = maxVideoUsageValue.slice(0, -1);
                        maxVideoUsageValue = videosPerArrayInput.value;
                    }
                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                        const response = yield fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        });
                        if (response.ok) {
                            const data = yield response.json();
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`;
                        }
                    }
                }));
                let videosPerArrayValue = '';
                videosPerArrayInput.addEventListener('input', () => __awaiter(this, void 0, void 0, function* () {
                    videosPerArrayValue = videosPerArrayInput.value;
                    if (!videosPerArrayValue.match(regex)) {
                        videosPerArrayInput.value = videosPerArrayValue.slice(0, -1);
                        videosPerArrayValue = videosPerArrayInput.value;
                    }
                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                        const response = yield fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        });
                        if (response.ok) {
                            const data = yield response.json();
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`;
                        }
                    }
                }));
            }
            catch (error) {
                console.error(error);
            }
        }
    }));
}
