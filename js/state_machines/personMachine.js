const { from } = rxjs;
import { createMachine, assign } from 'https://unpkg.com/xstate@4/dist/xstate.web.js';
import { flowerMachine } from "./flowerMachine.js";



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

const isApproaching = (context, {data}) => {
    const {faceSize} = decodeFaceData2(data);
    const {FACE_RANGE} = context;
    console.log('faceSize', faceSize, context.faceData.faceSize);
    return context.faceData.faceSize !== 0 && faceSize > context.faceData.faceSize + FACE_RANGE;
}

const isLeaving = (context, {data}) => {
    const { faceSize } = decodeFaceData2(data);
    const { FACE_RANGE } = context;
    console.log('faceSize', faceSize, context.faceData.faceSize);
    return faceSize < context.faceData.faceSize - FACE_RANGE;
}

const isStill = (context, {data}) => {
    const { faceSize } = decodeFaceData2(data);
    const { FACE_RANGE } = context;
    return faceSize <= context.faceData.faceSize + FACE_RANGE &&
        faceSize >= context.faceData.faceSize - FACE_RANGE;
}


export const personMachine = createMachine({
    initial: 'idle',
    context: {
        videoEl: null,
        faceData: {
            faceSize: 0,
            smilePercent: 0
        },
        FACE_RANGE: 1000,
    },
    invoke: {
        src: (ctx, event) => {
            const faceApiCall = () => {
                debugger;
                return faceapi.detectAllFaces(ctx.videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
            }
            const detectFace$ = from(faceApiCall());
            return rxjs.interval(1000).pipe(
                rxjs.switchMap(_ => detectFace$),
                rxjs.tap(x => {
                    console.log('deftect face');
                }),
                rxjs.map(x => ({type: 'FACE_DATA', x })));
        },
        onDone: 'finished',

    },
    states: {
        idle: {
            on: {
                INIT: {
                    actions: assign({
                        videoEl:(_, event) => event.videoEl
                    }),
                    target: 'running',
                },
            },
        },
        running: {
            invoke: {
                src: {
                    id: 'flower_machine',
                    src: flowerMachine,
                }
            },
            on: {
                FACE_DATA: {
                    actions: decodeFaceData,
                    target: 'person_detected',
                    cond: (context, {data}) => {
                        console.log('errrrrrson detected');
                        const {faceSize} = decodeFaceData2(data);
                        return faceSize > 0 ;
                    },
                },
            },
        },
        person_detected: {
            type: 'parallel',
            entry: (context)=> (send({type: 'PERSON_EVENT',context},{to: 'flower_machine'})),
            states: {
                movement: {
                    initial: 'standing_still',
                    states: {
                        standing_still: {
                            on: {
                                FACE_DATA: [{
                                    target: 'approaching',
                                    actions: decodeFaceData,
                                    cond: isApproaching,
                                },
                                    {
                                        target: 'leaving',
                                        actions: decodeFaceData,
                                        cond: isLeaving,
                                    }]
                            },
                        },
                        approaching: {
                            on: {
                                FACE_DATA: [{
                                    target: 'standing_still',
                                    actions: decodeFaceData,
                                    cond: isStill,
                                }]
                            }
                        },
                        leaving: {
                            on: {
                                FACE_DATA: [{
                                    target: 'standing_still',
                                    actions: decodeFaceData,
                                    cond: isStill,
                                }]
                            }
                        }
                    },
                },
                facial_expression: {
                    initial: 'neutral',
                    states: {
                        neutral: {},
                        smiling: {},
                    }
                }

            }
        },
        finished: { type: 'final'},
    },
});