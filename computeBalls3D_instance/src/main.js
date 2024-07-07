
import {
  mat4, vec3,
  vec4
} from './wgpu-matrix.module.js';
//console.log(mat4);

import { Camera } from '../../common/camera/camera.js';
import { simulation, physicsScene,initBalls } from './simulation.js';
import { Ray } from './Ray.js';
import { Ball } from './Ball.js';

import { Scene } from './Scene.js';
import { RADIUS , INSTANS_COUNT ,DEBAG_INDEX} from './settings.js';
import { createUniformData, updateUniformBuffer } from './uniformData.js';


let r; //ray
let curent_ball = 0;
let countRenderBall = 0;


async function main() {

  physicsScene.balls = await initBalls(INSTANS_COUNT);
  
  let scene = new Scene();
  
  //LOAD;
  await scene.preloader();  
  
  //---------------------------------------------------
  //INIT
  scene.balls = physicsScene.balls;
  await scene.create();   

  //---------------------------------------------------


  //---create uniform data
  let camera = new Camera(scene.canvas, vec3.create(0.0, 15.0, 50.0), vec3.create(0.0, -0.0, -1.0));
  r = new Ray(camera.eye, camera.front, scene.canvas, camera);
 
  // create uniform buffer and layout
  await createUniformData(scene);
  await updateUniformBuffer(scene,camera);
  

   // INIT - RENDER SETTINGS
  const depthTexture = scene.device.createTexture({
    size: [scene.canvas.clientWidth * devicePixelRatio, scene.canvas.clientHeight * devicePixelRatio, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });

  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined, //  Assigned later
        storeOp: "store", //ХЗ
        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
        loadOp: 'clear',
      },],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  scene.canvas.addEventListener("mousedown", mouseDown.bind(this), false);
  document.addEventListener("keydown", keyDown.bind(this), false);

  // UPDATE - RENDER   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
   
    //--------------SIMULATION--------------------------   
    //------------------MATRIX EDIT---------------------
    
    for (let i = 0; i < physicsScene.balls.length; i++) {
      let ball = physicsScene.balls[i];
      if(!ball.activ){
        continue;
      }
      let cell = physicsScene.HashTable.cellCoords(ball);      
      
      physicsScene.HashTable.setGrid(cell, ball); 		
      scene.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(1.0,1.0,1.0,1.0), (i) * (16 + 4) + 16);  	
    }


    for (let i = 0; i <  INSTANS_COUNT ; i++) {    
      
     // scene.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(1.0,1.0,1.0,1.0), (i) * (16 + 4) + 16);  
      
      
      let ball = simulation(i, dt, physicsScene.balls, scene); 

      scene.model.Sphere1.MODELMATRIX_meshGeometry = mat4.identity();
      scene.model.Sphere1.MODELMATRIX_meshGeometry = mat4.translate(scene.model.Sphere1.MODELMATRIX_meshGeometry, ball.position); 
      scene.model.Sphere1.MODELMATRIX_ARRAY.set(scene.model.Sphere1.MODELMATRIX_meshGeometry, (i) * (16 + 4) );  
      
       if(i == DEBAG_INDEX){
         scene.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(0.0,0.0,1.0,1.0), (i) * (16 + 4) + 16);  
       }
      //  else if(ball.marker){
      //    scene.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(1.0,1.0,0.0,1.0), (i) * (16 + 4) + 16);  
      //  }
         
    }

    physicsScene.HashTable.clearHashSet();

    //--------------------------------------------------


    camera.setDeltaTime(dt);
    await updateUniformBuffer(scene,camera);
   

    
    const commandEncoder = scene.device.createCommandEncoder();
    const textureView = scene.context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(scene.pipelines[0]);

    //Sphere1
    renderPass.setVertexBuffer(0, scene.model.Sphere1.sphereByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, scene.model.Sphere1.sphereByffers.uvBuffer);
    renderPass.setVertexBuffer(2, scene.model.Sphere1.sphereByffers.normalBuffer);
    renderPass.setIndexBuffer(scene.model.Sphere1.sphereByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, scene.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    renderPass.setBindGroup(1, scene.UNIFORM.BINDGROUP.uniformBindGroup_Ball);
    renderPass.drawIndexed(scene.model.Sphere1.index.length, countRenderBall, 0, 0, 0);

    //Plane1
    renderPass.setVertexBuffer(0, scene.model.Plane1.planeByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, scene.model.Plane1.planeByffers.uvBuffer);
    renderPass.setVertexBuffer(2, scene.model.Plane1.planeByffers.normalBuffer);
    renderPass.setIndexBuffer(scene.model.Plane1.planeByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, scene.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    renderPass.setBindGroup(1, scene.UNIFORM.BINDGROUP.uniformBindGroup_Plane);
    renderPass.drawIndexed(scene.model.Plane1.index.length);

    renderPass.end();
    scene.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(animate);
  };
  animate(0);

}

main();


//------EVENT------------------------------------

async function mouseDown(e){
   
  r.mouseDown(e);
  let p = r.at(10);
  
  physicsScene.balls[curent_ball].position = p;
  physicsScene.balls[curent_ball].activ = true;
  
  let velocity = vec3.sub(p, r.camera.eye);

  physicsScene.balls[curent_ball].velocity =  vec3.scale(vec3.normalize(velocity),2);
  
  curent_ball++;
  if(curent_ball==INSTANS_COUNT){
    //curent_ball = 0;
  }
  
  if(countRenderBall<=INSTANS_COUNT){
    countRenderBall++;
  }
};

async function keyDown(e){
 
  console.log(e)

  
  if(e.code == "Space"){

   // if(physicsScene.fit){
      physicsScene.boxScene.xn = -100;
      physicsScene.boxScene.xp = 100;

      physicsScene.boxScene.zn = -100;
      physicsScene.boxScene.zp = 100;

      physicsScene.boxScene.yn = -0;
      physicsScene.boxScene.yp = 100;
     
   // }
  }

  if(e.code == "KeyZ"){

      physicsScene.boxScene.xn += -1;
      physicsScene.boxScene.xp += 1;

      physicsScene.boxScene.zn += -1;
      physicsScene.boxScene.zp += 1;

      // physicsScene.boxScene.yn += -1;
      // physicsScene.boxScene.yp += 1;
     
    
  }
  if(e.code == "KeyX"){
    physicsScene.boxScene.xn += 1;
    physicsScene.boxScene.xp -= 1;

    physicsScene.boxScene.zn += 1;
    physicsScene.boxScene.zp -= 1;

    // physicsScene.boxScene.yn += 1;
    // physicsScene.boxScene.yp -= 1;
  }
  
  if(e.code == "KeyP"){
   
    let intervalID = setInterval(rain, 100);
    
  }   

};

function rain(){
 
  physicsScene.balls[curent_ball].position = vec3.set(20 * Math.random() - 10, 45, 20 * Math.random() - 10);
  physicsScene.balls[curent_ball].activ = true;
      
  curent_ball++;
  if(curent_ball==INSTANS_COUNT){
    curent_ball = 0;
  }
  
  if(countRenderBall<=INSTANS_COUNT){
    countRenderBall++;
  }
}


