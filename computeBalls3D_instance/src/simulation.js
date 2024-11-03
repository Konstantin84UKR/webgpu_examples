
import {
    mat4, vec3,
    vec4
} from './wgpu-matrix.module.js';
import { RADIUS , INSTANS_COUNT ,DEBAG_INDEX , TABLE_SCALE} from './settings.js';
import { Ball } from './Ball.js';
import { HashTable } from './HashTable.js';


    // Scene ---------------------------------------
export let physicsScene = 
	{
		gravity : vec3.set(0, -0.01, 0),
		//dt : 1.0 / 60.0,
		//worldSize : new Vector2(simWidth,simHeight),
		// paused: true,
		balls: [],				
		restitution : .95,
        friction : 0.99,
        HashTable : undefined,

        fit : true,

        boxScene: {
           xp: 25, 
           xn: -25, 
           yp: 50, 
           yn: 0, 
           zp: 25, 
           zn: -25, 
        }
	};

export function simulation(indexBall, dt , balls,scene) {
     
    

    let ball = balls[indexBall];

    
    if(!ball.activ){
        return ball;
    }
  

    ball.oldPosition = vec3.clone(ball.position);
    ball.position = vec3.add(ball.position, ball.velocity);

    
    let cell = physicsScene.HashTable.cellCoords(ball);
			let BallsForTestCollision = [];
			for (let xi = -1; xi < 2; xi++) {

				for (let yj = -1; yj < 2; yj++) {

                    for (let zj = -1; zj < 2; zj++) {
					
					const Xh = cell.x + xi;
					const Yh = cell.y + yj;
                    const Zh = cell.z + zj;

					let arr = physicsScene.HashTable.getGrid({x:Xh,y:Yh,z:Zh});
					BallsForTestCollision.push(arr);

                    if(indexBall == DEBAG_INDEX){
                        scene.updateDebagColor(arr, vec4.set(1.0,0.0,0.0,1.0));
                    }else{
                        //scene.updateDebagColor(arr, vec4.set(0.2,0.2,0.2,1.0));
                    }

                    }
									
				}
			} 
		
			BallsForTestCollision = BallsForTestCollision.flat();
    
    //---------------------------------------------------------------------
    for (let j = 0; j < BallsForTestCollision.length; j++) {			
        let ball2 = BallsForTestCollision[j];	
        
        handleBallCollision(ball, ball2);
    }
    //----------------------------------------------------------------------
    handleWallCollision(ball);
    

    ball.velocity = vec3.add(ball.velocity, physicsScene.gravity);
    ball.velocity = vec3.scale(ball.velocity, physicsScene.friction);
    let velocity = vec3.scale(ball.velocity, dt / 1000);
    ball.position = vec3.add(ball.position, velocity);

    return ball;
}

export async function initBalls(count){
    
    let arr = [];
    for (let index = 0; index < count; index++) {
  
      const position = vec3.set(0, 0, 0);
      const velocity = vec3.set(0, 0, 0);
      const mass = RADIUS * RADIUS;
  
      let ball = new Ball(RADIUS, mass, position, velocity, index)
  
      arr.push(ball);   
    }

    physicsScene.HashTable = new HashTable(TABLE_SCALE,50);
  
    return arr;
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

function handleWallCollision(ball){
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
}

// accelerate(accel) {
//     this.velocity.addTo(accel);
// }

// update() {
//     this.accelerate(this.gravity);
//     this.position.addTo(this.velocity);

// }

