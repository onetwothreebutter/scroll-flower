/*
 * main.js
 */

// Load up the web worker
const ImageLoaderWorker = new Worker('js/workers/image-loader.worker.js')

let imageLoadCount = 0;
ImageLoaderWorker.addEventListener('message', event => {
    // Grab the message data from the event
    const imageData = event.data

    if(imageData.error) {
        console.log("imageData.error", imageData.error);
    }

    // Get the original element for this image
    const imageElement = document.querySelectorAll(`img[data-original-src='${imageData.imageURL}']`)[0];
    // We can use the `Blob` as an image source! We just need to convert it
    // to an object URL first
    const objectURL = URL.createObjectURL(imageData.blob)

    // Once the image is loaded, we'll want to do some extra cleanup
    imageElement.onload = () => {
        imageLoadCount += 1;
        console.log('imageLoadCount', imageLoadCount);
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
    const imageResize = window.screen.width < 600 ? 818 : 1920;
    const baseURL = `/images/${mobileFlag}Daffodil-34826${index.toString().padStart(4, '0')}.jpg`;
    const netlifyParams = `?nf_resize=fit&w=${imageResize}`;
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


const FRAMES_TO_SKIP = 4;
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


Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('js/face-api/face-models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('js/face-api/face-models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('js/face-api/face-models'),
    faceapi.nets.faceExpressionNet.loadFromUri('js/face-api/face-models')
]).then(startVideo)

// Prefer camera resolution nearest to 1280x720.
var constraints = { audio: true, video: { width: 1280, height: 720 } };
var video = document.querySelector('video');

function startVideo() {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(mediaStream) {
            video.srcObject = mediaStream;
            video.onloadedmetadata = function(e) {
                video.play();
            };
        })
        .catch(function(err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.

}


video.addEventListener('play', () => {
    //create the canvas from video element as we have created above
    const canvas = faceapi.createCanvasFromMedia(video);
    //append canvas to body or the dom element where you want to append it
    document.body.append(canvas)
    // displaySize will help us to match the dimension with video screen and accordingly it will draw our detections
    // on the streaming video screen
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)

    // ---- observable ----

    const faceApiCall = () => {
        return faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    }

    const detectFace$ = rxjs.from(faceApiCall())

    const getFrameIndex = (fraction) => {
        return Math.min(
            frameCount - 1,
            Math.ceil(fraction * frameCount)
        );
    };

    const smileStream$ = rxjs.interval(50).pipe(
        rxjs.switchMap(_ => detectFace$),
        rxjs.map(x => x[0].expressions.happy),
        rxjs.map(x => Math.sqrt(x)),
        rxjs.scan((acc,x)=>{
            return [acc.pop(), x];
        },[0]),
        rxjs.map(x => [getFrameIndex(x[0]), getFrameIndex(x[1])]),
        rxjs.concatMap(x => rxjs.range(x[0], x[1])),
        rxjs.observeOn(rxjs.animationFrameScheduler),
    );


    const aaaa = smileStream$.subscribe( x=> {
        console.log(x);
        updateImage(x);
    });

    // `scan` lets you aggregate values over time
    // `takeUntil` will cancel an inprogress observable if an event is emitted from the passed in observable
    //

    // if a smile is detected, then call `updateImage` smoothly from 0 to where the smile is at
    //

    
    // ---- regular ----

    // setInterval(async () => {
    //     const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    //     const resizedDetections = faceapi.resizeResults(detections, displaySize)
    //     canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    //     faceapi.draw.drawDetections(canvas, resizedDetections)
    //     faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    //     faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    //     console.time('detectAllFaces');
    //     const detectionsWithExpressions = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    //     console.timeEnd('detectAllFaces');
    //     console.log("detectionsWithExpressions", detectionsWithExpressions[0].expressions);
    //     let scrollFraction = 0;
    //     scrollFraction =  Math.cbrt(detectionsWithExpressions[0].expressions.happy);
        //console.log('srollfraction', scrollFraction);




        //const everyNthFrame = FRAMES_TO_SKIP * Math.round(frameIndex / FRAMES_TO_SKIP);
        //const everyNthFrame = frameIndex;

        // requestAnimationFrame(() => updateImage(everyNthFrame));

    });


