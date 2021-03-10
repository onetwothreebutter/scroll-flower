/*
 * main.js
 */

// Load up the web worker
const ImageLoaderWorker = new Worker('js/workers/image-loader.worker.js')


ImageLoaderWorker.addEventListener('message', event => {
    // Grab the message data from the event
    const imageData = event.data

    // Get the original element for this image
    const imageElement = document.querySelectorAll(`img[data-original-src='${imageData.imageURL}']`)[0];
    // We can use the `Blob` as an image source! We just need to convert it
    // to an object URL first
    const objectURL = URL.createObjectURL(imageData.blob)

    // Once the image is loaded, we'll want to do some extra cleanup
    imageElement.onload = () => {
        // Let's remove the original `data-src` attribute to make sure we don't
        // accidentally pass this image to the worker again in the future
        imageElement.removeAttribute('data-original-src')

        // We'll also revoke the object URL now that it's been used to prevent the
        // browser from maintaining unnecessary references
        URL.revokeObjectURL(objectURL)
    }

    imageElement.setAttribute('src', objectURL)
});

const TOTAL_IMAGES = 1410;
const ACTIVE_CLASS = 'active';


const imageURL = (index) => {
    const mobileFlag = window.screen.width < 600 ? `mobile/` : 'desktop/';
    const baseURL = `/images/${mobileFlag}Daffodil-34826${index.toString().padStart(4, '0')}.jpg`;
    const netlifyParams = `?nf_resize=fit&w=1920`;
    return (window.location.href.includes('localhost')) ?
        `/scroll-flower${baseURL}` : `${baseURL}${netlifyParams}`;
}

const addEmptyImgToPage = index => {
    const newImg = document.createElement('img');
    newImg.dataset.imageIndex = index;
    newImg.dataset.originalSrc = imageURL(index);
    if(index === 0) {
        newImg.classList.add(ACTIVE_CLASS);
    }
    document.body.appendChild(newImg);
}

const loadImageAtIndex = index => {
    ImageLoaderWorker.postMessage(imageURL(index));
};


const FRAMES_TO_SKIP = 2;
for(let i = 0; i <= TOTAL_IMAGES; i += FRAMES_TO_SKIP) {
    addEmptyImgToPage(i);
    loadImageAtIndex(i);
}

let retries = 0;
const updateImage = (index) => {
    const activeImage = document.querySelector('.active');
    const imageToUpdate = document.querySelector(`[data-image-index="${index}"]`);
    if (!imageToUpdate) {
        retries += 1;
        return retries < 100 ? updateImage(index + 1) : false;
    }
    retries = 0;
    activeImage.classList.remove(ACTIVE_CLASS);
    imageToUpdate.classList.add(ACTIVE_CLASS);
}

const frameCount = TOTAL_IMAGES;
window.addEventListener('scroll', () => {
    const html = document.querySelector('html');
    const scrollTop = html.scrollTop;
    const maxScrollTop = html.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    const frameIndex = Math.min(
        frameCount - 1,
        Math.ceil(scrollFraction * frameCount)
    );

    const everyNthFrame = FRAMES_TO_SKIP * Math.round(frameIndex / FRAMES_TO_SKIP);
    console.log( 'frameIndex', everyNthFrame);

    requestAnimationFrame(() => updateImage(everyNthFrame));
});

