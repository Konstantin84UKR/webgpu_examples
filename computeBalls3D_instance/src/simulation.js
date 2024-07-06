
import {
    mat4, vec3
} from './wgpu-matrix.module.js';

    // Scene ---------------------------------------
    let physicsScene = 
	{
		gravity : vec3.set(0, -0.01, 0),
		//dt : 1.0 / 60.0,
		//worldSize : new Vector2(simWidth,simHeight),
		// paused: true,
		//balls: [],				
		restitution : .95,
        friction : .99,

        boxScene: {
           xp: 15, 
           xn: -15, 
           yp: 35, 
           yn: 0, 
           zp: 30, 
           zn: -80, 
        }
	};



export function simulation(indexBall, dt , balls) {
     
    

    let ball = balls[indexBall];
  

    ball.oldPosition = vec3.clone(ball.position);
    ball.position = vec3.add(ball.position, ball.velocity);
    
    //---------------------------------------------------------------------
    for (let j = 0; j < balls.length; j++) {			
        let ball2 = balls[j];	
        
        handleBallCollision(ball, ball2);
    }
    //----------------------------------------------------------------------

    if ((ball.position[0]) > physicsScene.boxScene.xp - ball.radius || (ball.position[0]) < physicsScene.boxScene.xn + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[0] = Math.min(Math.max(ball.position[0], (physicsScene.boxScene.xn + ball.radius)), (physicsScene.boxScene.xp - ball.radius));
        ball.velocity[0] *= ball.bounce;
    }

    if ((ball.position[2]) > physicsScene.boxScene.zp - ball.radius || (ball.position[2]) < physicsScene.boxScene.zn+ ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[2] = Math.min(Math.max(ball.position[2], (physicsScene.boxScene.zn + ball.radius)), (physicsScene.boxScene.zp - ball.radius));
        ball.velocity[2] *= ball.bounce;
    }

    if ((ball.position[1] - ball.radius) < physicsScene.boxScene.yn || (ball.position[1]) > physicsScene.boxScene.yp + ball.radius) {
        ball.position = ball.oldPosition;
        ball.position[1] = Math.min(Math.max(ball.position[1], ball.radius), physicsScene.boxScene.yp + ball.radius);
        ball.velocity[1] *= ball.bounce;

        if (vec3.lenSq(ball.velocity) < 0.001) {
            ball.position[1] = ball.radius;
            ball.velocity = vec3.set(0, 0, 0);
        }
    }
    
    

    ball.velocity = vec3.add(ball.velocity, physicsScene.gravity);
    ball.velocity = vec3.scale(ball.velocity, physicsScene.friction);
    let velocity = vec3.scale(ball.velocity, dt / 1000);
    ball.position = vec3.add(ball.position, velocity);

    return ball;
}

function handleBallCollision(ball1, ball2){
   
    if(!ball1.activ || !ball2.activ){
        return;
    }

    let dir = vec3.subtract(ball2.position, ball1.position);
    let d = vec3.length(dir);
    if (d == 0.0 || d > ball1.radius + ball2.radius)
        return;

    dir = vec3.scale(dir,1.0 / d);

    let corr = (ball1.radius + ball2.radius - d) / 2.0;

    // ball1.pos.add(dir, -corr);
    // ball2.pos.add(dir, corr);

    let dirCoor = vec3.scale(dir,corr);

    ball1.position = vec3.add(ball1.position , vec3.negate(dirCoor));
    ball2.position = vec3.add(ball2.position , dirCoor);

    // ball1.position = vec3.add(ball1.position , vec3.negate(dirCoor));
    // ball2.position = vec3.add(ball1.position , dirCoor);
    
    let v1 =  vec3.dot(ball1.velocity,dir);
    let v2 =  vec3.dot(ball2.velocity,dir);

    let m1 = ball1.mass;
    let m2 = ball2.mass;

    let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * physicsScene.restitution) / (m1 + m2);
    let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * physicsScene.restitution) / (m1 + m2);

    ball1.velocity = vec3.add( ball1.velocity, vec3.scale(dir, newV1 - v1));
    ball2.velocity = vec3.add( ball2.velocity, vec3.scale(dir, newV2 - v2));

}

// accelerate(accel) {
//     this.velocity.addTo(accel);
// }

// update() {
//     this.accelerate(this.gravity);
//     this.position.addTo(this.velocity);

// }

