import { mainWindowAPI } from './mainWindowAPI.js'
import createNotification from './notification.js'

export default function calculateVideos() {
    const elementID = 'calculateVideos-Button'
    const element = document.getElementById(elementID)!

    element.addEventListener('click', async () => {
        if (localStorage.getItem('currentTab') !== 'calculateVideos') {
            console.clear()

            // Set the current tab
            localStorage.setItem('currentTab', 'calculateVideos')

            // Clear the main window
            mainWindowAPI.clear()

            try {
                const componentPath = '../components/calculateVideos.html'
                console.log('MAIN WINDOW API CALL TO: ', componentPath)
                await mainWindowAPI.add(componentPath)

                async function addInput1(value: string) {
                    const input1 = document.getElementById('input1') as HTMLInputElement
                    input1.value = value

                    maxVideoUsageValue = input1.value

                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                        const response = await fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`
                        }
                    }
                }

                async function addInput2(value: string) {
                    const input2 = document.getElementById('input2') as HTMLInputElement
                    input2.value = value

                    videosPerArrayValue = input2.value

                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {
                        const response = await fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`
                        }
                    }
                }

                for (let x = 1; x <= 9; x++) {
                    document.getElementById(`input1-btn-${x}`)!.addEventListener('click', () => {
                        addInput1(`${x}`)
                    })
                }

                for (let x = 1; x <= 9; x++) {
                    document.getElementById(`input2-btn-${x}`)!.addEventListener('click', () => {
                        addInput2(`${x}`)
                    })
                }

                const maxVideoUsageInput = document.getElementById('input2') as HTMLInputElement
                const videosPerArrayInput = document.getElementById('input2') as HTMLInputElement
                const resultElement = document.getElementById('output-numberOfCombinations') as HTMLParagraphElement

                const regex = /^[0-9]+$/

                let maxVideoUsageValue = ''
                maxVideoUsageInput.addEventListener('input', async () => {
                    maxVideoUsageValue = maxVideoUsageInput.value

                    if (!maxVideoUsageValue.match(regex)) {
                        maxVideoUsageInput.value = maxVideoUsageValue.slice(0, -1)
                        maxVideoUsageValue = videosPerArrayInput.value
                    }

                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {

                        const response = await fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`
                        }
                    }
                })

                let videosPerArrayValue = ''
                videosPerArrayInput.addEventListener('input', async () => {
                    videosPerArrayValue = videosPerArrayInput.value

                    if (!videosPerArrayValue.match(regex)) {
                        videosPerArrayInput.value = videosPerArrayValue.slice(0, -1)
                        videosPerArrayValue = videosPerArrayInput.value
                    }

                    if (maxVideoUsageValue !== '' && videosPerArrayValue !== '') {

                        const response = await fetch('/calculate-videos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                maxVideoUsageInput: maxVideoUsageValue,
                                videosPerArrayInput: videosPerArrayValue,
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            resultElement.innerHTML = `Max Combinations: ${data.maxCombinations}`
                        }
                    }
                })
            } catch (error) {
                console.error(error)
            }
        }
    })
}