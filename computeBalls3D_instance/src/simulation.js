
import {
    mat4, vec3
} from './wgpu-matrix.module.js';

export function simulation(ball, dt) {
    //const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    const friction = 0.999;
    

    ball.oldPosition = vec3.clone(ball.position);
    ball.position = vec3.add(ball.position, ball.velocity);

    if ((ball.position[0]) > 15 - ball.radius || (ball.position[0]) < -15 + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[0] = Math.min(Math.max(ball.position[0], (-15 + ball.radius)), (15 - ball.radius));
        ball.velocity[0] *= ball.bounce;
    }

    if ((ball.position[2]) > 35 - ball.radius || (ball.position[2]) < -70 + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[2] = Math.min(Math.max(ball.position[2], (-70 + ball.radius)), (35 - ball.radius));
        ball.velocity[2] *= ball.bounce;
    }

    if ((ball.position[1] - ball.radius) < 0 || (ball.position[1]) > 35 + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[1] = Math.min(Math.max(ball.position[1], ball.radius), 35 + ball.radius);
        ball.velocity[1] *= ball.bounce;

        if (vec3.lenSq(ball.velocity) < 0.001) {
            ball.position[1] = ball.radius;
            ball.velocity = vec3.set(0, 0, 0);
        }
    }
    ball.velocity = vec3.add(ball.velocity, ball.gravity);
    ball.velocity = vec3.scale(ball.velocity, friction);
    let velocity = vec3.scale(ball.velocity, dt / 1000);
    ball.position = vec3.add(ball.position, velocity);

    return ball;
}


// accelerate(accel) {
//     this.velocity.addTo(accel);
// }

// update() {
//     this.accelerate(this.gravity);
//     this.position.addTo(this.velocity);

// }

