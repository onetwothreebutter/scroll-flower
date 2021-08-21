import { createMachine, assign } from 'https://unpkg.com/xstate@4/dist/xstate.web.js';


// flower states
// flower opens a bit when it detects a person (PERSON_DETECTED) to frame 96
// flower opens more as the person approaches, matching the velocity of their approach (PERSON_APPROACHING)
// flower closes as person backs away or moves out of center (PERSON_LEAVING)
// flower opens a bit more when a person smiles (SMILE_DETECTED)
// flower opens more as the person's smile increases (SMILE_INCREASING)
// flower opens more at a steady rate as person's smile is sustained (SMILE_SUSTAINED)
// flower closes as persons's smile goes down (SMILE_DECREASING)


// flowerMachine, have the flower 'tick' every animation frame and update its current frame based on previous frame
// and the state of the person (standing_still, smiling, etc)
const updateFrame = assign({
    frame: (ctx) => ctx.frame + ctx.velocity,
});

export const flowerMachine = createMachine({
    id: 'flower_machine',
    initial: 'closed',
    context: {
        frame: 0,
        velocity: 1,
        TOTAL_FRAMES: 1400,
    },
    states: {
        closed: {
            on: {
                PERSON_EVENT: {
                    target: 'opening',
                    cond: (ctx) => {
                        console.log('opening in flower machine', ctx);
                    }
                }
            }
        },
        opening: {
            invoke: {
                src: (context, event) => {
                    return rxjs.interval(0, rxjs.animationFrame).pipe(
                        rxjs.map(x => {
                            return {type: 'FLOWER_FRAME', event};
                        })
                    )
                }
            },
            on: {
                FLOWER_FRAME: {
                    actions: updateFrame,
                    cond: (ctx) => {
                        return ctx.frame < ctx.TOTAL_FRAMES && ctx.frame >= 0;
                    }
                }
            }
        },
        open: {

        },
        closing: {

        }
    }
})