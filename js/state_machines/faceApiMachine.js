import {personMachine} from "./personMachine.js";

const {from} = rxjs;
import {createMachine, assign, send} from 'https://unpkg.com/xstate@4/dist/xstate.web.js';


const decodeFaceData = assign({
    faceData: (ctx, data) => {
        return decodeFaceData2(data);
    }
});

const decodeFaceData2 = (faceData) => {
    return {
        faceSize: faceData.alignedRect?.box?.area || 0,
        smilePercent: faceData.expressions?.happy || 0,
    }
};


export const faceApiMachine = createMachine({
    initial: 'idle',
    context: {
        videoEl: null,
    },
    invoke: {
        id: 'personmachine',
        src: personMachine,
    },
    states: {
        idle: {
            on: {
                INIT: {
                    actions: assign({
                        videoEl: (_, event) => event.videoEl
                    }),
                    target: 'running',
                },
            },
        },
        running: {
            invoke:
                {
                    src: (ctx) => {
                        const faceApiCall = () => {
                            return faceapi.detectAllFaces(ctx.videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
                        }
                        const detectFace$ = from(faceApiCall());
                        return rxjs.interval(1000).pipe(
                            rxjs.switchMap(_ => detectFace$),
                            rxjs.tap(x => {
                                console.log('faceApiMachine');
                            }),
                            rxjs.map(x => ({
                                type: 'FACE_DATA',
                                value: x[0]
                            })));
                    },
                    onDone: 'finished',
                }
            ,
            on: {
                FACE_DATA: {
                    actions: (context, event) => {
                        console.log('sendFaceDataToPersonMachine');
                        send({type: 'FACE_DATA', value: event}, {to: 'personmachine'});
                    },
                },
                DONE: {
                    target: 'finished',
                },
            },
        },
        finished: {type: 'final'}
    },
    actions: {
        sendFaceDataToPersonMachine: (context, event) => {
            console.log('sendFaceDataToPersonMachine');
            send({type: 'FACE_DATA', value: event}, {to: 'personmachine'});
        }
    }
});