
import {
  mat4, vec3,
  vec4
} from './wgpu-matrix.module.js';
//console.log(mat4);

import { Camera } from '../../common/camera/camera.js';
import { simulation, physicsScene,initBalls} from './simulation.js';
import { Ray } from './Ray.js';
import { Ball } from './Ball.js';

import { Scene } from './Scene.js';
import { RADIUS , INSTANS_COUNT ,DEBAG_INDEX, TABLE_SCALE} from './settings.js';
import { createUniformData, updateUniformBuffer } from './uniformData.js';

let curent_ball = 0;
let scene; 

async function main() {

  physicsScene.balls = await initBalls(INSTANS_COUNT);  
  scene = new Scene(physicsScene);
  
  //---------------------------------------------------
  //LOAD;
  await scene.preloader();   
   
  //---------------------------------------------------
  //INIT
  await scene.create();
 
  await createUniformData(scene);
  await updateUniformBuffer(scene,scene.camera);
  scene.initRenderSetting();
  
  scene.canvas.addEventListener("mousedown", mouseDown.bind(this), false);
  document.addEventListener("keydown", keyDown.bind(this), false);

  //---------------------------------------------------
  //RENDER   
  scene.update(0);
  //---------------------------------------------------
}

main();

//---------------------------------------------------
//EVENT

async function mouseDown(e){
   
  scene.ray.mouseDown(e);
  let p = scene.ray.at(10);
  
  scene.physicsScene.balls[curent_ball].position = p;
  scene.physicsScene.balls[curent_ball].activ = true;
  
  let velocity = vec3.sub(p, scene.ray.camera.eye);

  scene.physicsScene.balls[curent_ball].velocity =  vec3.scale(vec3.normalize(velocity),2);
  
  curent_ball++;
  if(curent_ball==INSTANS_COUNT){
    //curent_ball = 0;
  }
  
  if(scene.countRenderBall<=INSTANS_COUNT){
    scene.countRenderBall++;
  }
};

async function keyDown(e){
 
  console.log(e)

  
  if(e.code == "Space"){
 
    scene.physicsScene.boxScene.xn = -100;
    scene.physicsScene.boxScene.xp = 100;

    scene.physicsScene.boxScene.zn = -100;
    scene.physicsScene.boxScene.zp = 100;

    scene.physicsScene.boxScene.yn = -0;
    scene.physicsScene.boxScene.yp = 100;

  }

  if(e.code == "KeyZ"){

    scene.physicsScene.boxScene.xn += -1;
    scene.physicsScene.boxScene.xp += 1;

    scene.physicsScene.boxScene.zn += -1;
    scene.physicsScene.boxScene.zp += 1;
   
  }
  if(e.code == "KeyX"){
    scene.physicsScene.boxScene.xn += 1;
    scene.physicsScene.boxScene.xp -= 1;

    scene.physicsScene.boxScene.zn += 1;
    scene.physicsScene.boxScene.zp -= 1;

  }
  
  if(e.code == "KeyP"){
   
    let intervalID = setInterval(rain, 10);
    
  }   

};

function rain(){
 
  scene.physicsScene.balls[curent_ball].position = vec3.set(20 * Math.random() - 10, 60, 20 * Math.random() - 10);
  scene.physicsScene.balls[curent_ball].activ = true;
      
  curent_ball++;
  if(curent_ball==INSTANS_COUNT){
    curent_ball = 0;
  }
  
  if(scene.countRenderBall<=INSTANS_COUNT){
    scene.countRenderBall++;
  }
}


