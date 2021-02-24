/*
 * main.js
 */

const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

const frameCount = 1400;

const imageURL = (index) => {
    const baseURL = `/images/Daffodil-34826${index.toString().padStart(4, '0')}.jpg`;
    const netlifyParams = `?nf_resize=fit&w=1920`;
    return (window.location.href.includes('localhost')) ?
        `/scroll-flower${baseURL}` : `${baseURL}${netlifyParams}`;
}

const currentFrame = index => {
    return imageURL(index);
}

const preloadImages = () => {
    for (let i = 1; i < frameCount; i += 5) {
        const img = new Image();
        img.src = currentFrame(i);
    }
};

const img = new Image()
img.src = currentFrame(1);
const imageAspect = 2560 / 1440;
canvas.width = 900;
canvas.height = 900 / imageAspect;
img.onload=function(){
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
}

const updateImage = index => {
    img.src = currentFrame(index);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
}

window.addEventListener('scroll', () => {
    const scrollTop = html.scrollTop;
    const maxScrollTop = html.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    const frameIndex = Math.min(
        frameCount - 1,
        Math.ceil(scrollFraction * frameCount)
    );

    requestAnimationFrame(() => updateImage(frameIndex + 1))
});

preloadImages()





