import {personMachine} from "./personMachine.js";

const {Observable, interval, map, take, from, of, defer} = rxjs;
import {createMachine, assign, send} from 'https://unpkg.com/xstate@4.23.1/dist/xstate.web.js';




export const faceApiMachine = createMachine({
    initial: 'idle',
    context: {
        videoEl: null,
    },
    invoke: {
        id: 'person-machine',
        src: personMachine,
    },
    states: {
        idle: {
            on: {
                INIT: {
                    actions: assign({
                        videoEl: (_, event) => {
                            return event.videoEl

                        }
                    }),
                    target: 'running',
                },
            },
        },
        running: {
            invoke: [
                // {
                //     id: 'person-machine',
                //     src: personMachine,
                // },
                {
                    src: (ctx) => {

                        const faceApiCall = () => {
                            console.log('faceapi', faceapi);
                            return faceapi.detectAllFaces(ctx.videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
                        };

                        const faceApi$ = from(faceApiCall());

                        return rxjs.timer(0,100).pipe(
                            rxjs.switchMap(_ => faceApi$),
                            rxjs.map(x => {
                                console.log("faceAPI',", x);
                                return {
                                    type: 'FACE_DATA',
                                    value: x
                                };
                            }
                            ));
                    },
                    onDone: 'finished',
                }
            ],
            on: {
                FACE_DATA: {
                    actions: {...send((ctx, data) => ({type: 'FACE_DATA', data})), to: 'person-machine'},
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