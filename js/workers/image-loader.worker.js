/*
 * image-loader.worker.js
 */

self.addEventListener('message', async event => {
    const imageURL = event.data

    try{
        const response = await fetch(imageURL)
        const blob = await response.blob()
        // Send the image data to the UI thread!
        self.postMessage({
            imageURL: imageURL,
            blob: blob,
        })
    } catch(e) {
        self.postMessage({
            error: e,
        })
    }

})