
import {
    mat4, vec3
} from './wgpu-matrix.module.js';

export function simulation(ball, dt) {
    //const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    ball.velosity = vec3.add(ball.velosity, ball.gravity)
    ball.oldPosition = vec3.clone(ball.position);
    ball.position = vec3.add(ball.position, ball.velosity);

    if ((ball.position[0]) > 15 - ball.radius || (ball.position[0]) < -15 + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[0] = Math.min(Math.max(ball.position[0], (-15 + ball.radius)), (15 - ball.radius));
        ball.velosity[0] *= -1;
    }

    if ((ball.position[2]) > 15 - ball.radius || (ball.position[2]) < -15 + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[2] = Math.min(Math.max(ball.position[2], (-15 + ball.radius)), (15 - ball.radius));
        ball.velosity[2] *= -1;
    }

    if ((ball.position[1] - ball.radius) < 0) {
        ball.position = ball.oldPosition;
        ball.position[1] = Math.min(Math.max(ball.position[1], 0 + ball.radius), 15 - ball.radius);
        ball.velosity[1] *= -1;

        if (vec3.lenSq(ball.velosity) < 0.001) {
            ball.position[1] = ball.radius;
            ball.velosity = vec3.set(0, 0, 0);
        }
    }
    const friction = 0.995;
    ball.velosity = vec3.scale(ball.velosity, friction);
    let velosity = vec3.scale(ball.velosity, dt / 1000);
    ball.position = vec3.add(ball.position, velosity);

    return ball;
}

