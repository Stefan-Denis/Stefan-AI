export const mainWindowAPI = {
    window: document.getElementById('main')!,

    clear: () => {
        const window = mainWindowAPI.window
        while (window.firstChild) {
            window.removeChild(window.firstChild)
        }
    },

    add: (filename: string) => {
        document.getElementById('main-stylesheet')?.setAttribute('href', 'css/style.css')
        return new Promise((resolve, reject) => {
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        const parser = new DOMParser()
                        const newDocument = parser.parseFromString(this.responseText, 'text/html')
                        const content = newDocument.body.innerHTML
                        mainWindowAPI.window.innerHTML = content
                        resolve(true)
                    } else {
                        reject(new Error(`Error loading ${filename}: ${this.status}`))
                    }
                }
            }
            xhttp.open('GET', filename, true)
            xhttp.send()
        })
    }

}
