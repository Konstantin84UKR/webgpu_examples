
import {
  mat4, vec3,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';

import { shaderMatCap } from './matcapPipline/shaderMatCap.js';
import { shaderRayTracing } from './postEffectRender/shaders/shaderRayTracing.js';
import { initVertexBuffers } from './initVertexBuffers.js';
import { initUniformBuffers } from './initUniformBuffers.js';

import { initResurse } from './initResurse.js';
import { initPipeline as initMatCaptPipeline} from './matcapPipline/initPipeline.js';
import { initPipeline as initRayTracingPipeline} from './postEffectRender/initPipeline.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';


async function main() {
  
    //---create uniform data
    const sampleCount = 4;
    const instance_count = 12;
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(false);
  //initResurse
  const { modelSphere, texture, sampler,textureCUBE}= await initResurse(device);
    ///**  Шейдеры тут все понятно более мение. */  
 
  //****************** BUFFER ********************//
    //initBuffers
  await initVertexBuffers(device, modelSphere);
  const {uBuffers} = await initUniformBuffers(device,instance_count);
  
    
    let MODELMATRIX = mat4.identity();
    let NORMALMATRIX = mat4.identity();
    // let VIEWMATRIX = mat4.identity(); 
    // let PROJMATRIX = mat4.identity();

    let MODELMATRIX_ARRAY = new Float32Array(instance_count * 16 ); // Model
    let NORMALMATRIX_ARRAY = new Float32Array(instance_count * 16 ); // Model
    let INSTANSPOSITION_ARRAY = new Float32Array(instance_count * 4 ); // Model
    //---create uniform data
    let camera = new Camera(canvas, vec3.create(0.0, 0.0, 20.0), vec3.create(0.0, 0.0, -1.0));

    let VIEWMATRIXinvert = mat4.invert(camera.vMatrix); 
    let PROJMATRIXinvert = mat4.invert(camera.pMatrix);


      

  
    const centers = new Array(instance_count).fill(0).map(_ =>{
     let v = vec3.create();
     v.set([
      Math.random() * 20 - 10.0,
      Math.random() * 20 - 10.0,
      Math.random() * 20 - 10.0]);

     return v}           
    );
   
   const radiuses = new Array(instance_count).fill(0).map(_ => Math.random() * 1.0 + 1.0);

   //const radiuses = new Array(instance_count).fill(0).map(_ =>  2.0);

     let k = 0;
      for (let i = 0; i < instance_count ; i++) {
                            
            mat4.identity(MODELMATRIX);
         
            MODELMATRIX = mat4.translate(MODELMATRIX,[centers[i][0],centers[i][1],centers[i][2]]);    
            const s =radiuses[i];
            MODELMATRIX = mat4.scale(MODELMATRIX,vec3.set(s,s,s));          
         
            MODELMATRIX_ARRAY.set(MODELMATRIX, (k) * 16);
                    
            NORMALMATRIX = mat4.invert(MODELMATRIX);
            NORMALMATRIX = mat4.transpose(MODELMATRIX);
            NORMALMATRIX_ARRAY.set(NORMALMATRIX, (k) * (16));
            k++;
       
      }
    
      await RAPIER.init();
      const world = new RAPIER.World({x:0,y:0,z:0});
      const bodies = centers.map((center, i) => {
        const bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic)
          .setTranslation(center[0], center[1], center[2]);
        const body = world.createRigidBody(bodyDesc);
        body.mass = 4/3 * Math.PI * radiuses[i] ** 3;
        //body.mass = 1;
      
        const colliderDesc = RAPIER.ColliderDesc.ball(radiuses[i]).setFriction(0.5);
        world.createCollider(colliderDesc, body);

        
      
        return body;
      })

       const colliderDescCuboid0 = RAPIER.ColliderDesc.cuboid(50.0, 0.2, 50.0);
        colliderDescCuboid0.setTranslation(0.0, -50.0, 0.0)
        world.createCollider(colliderDescCuboid0);

        const colliderDescCuboid1 = RAPIER.ColliderDesc.cuboid(50.0, 0.2, 50.0);
        colliderDescCuboid1.setTranslation(0.0, 50.0, 0.0)
        world.createCollider(colliderDescCuboid1);

        const colliderDescCuboid2 = RAPIER.ColliderDesc.cuboid(50.0, 50., 0.2);
        colliderDescCuboid2.setTranslation(0.0, 0.0, -50.0)
        world.createCollider(colliderDescCuboid2);

        const colliderDescCuboid3 = RAPIER.ColliderDesc.cuboid(50.0, 50., 0.2);
        colliderDescCuboid3.setTranslation(0.0, 0.0, 50.0)
        world.createCollider(colliderDescCuboid3);

        const colliderDescCuboid4 = RAPIER.ColliderDesc.cuboid(0.2, 50., 50.0);
        colliderDescCuboid4.setTranslation(50.0, 0.0, 0.0)
        world.createCollider(colliderDescCuboid4);

        const colliderDescCuboid5 = RAPIER.ColliderDesc.cuboid(0.2, 50., 50.0);
        colliderDescCuboid5.setTranslation(-50.0, 0.0, 0.0)
        world.createCollider(colliderDescCuboid5);
        

    
    //*********************************************//
    //** настраиваем конвейер рендера 
    const {pipeline} = await initMatCaptPipeline(device, canvas, format, shaderMatCap,sampleCount,sampler,texture,instance_count,uBuffers)
    const {pipeline: pipelineRayTracing } = await initRayTracingPipeline(device, canvas, format, shaderRayTracing,sampleCount,instance_count,uBuffers,textureCUBE)
    
    // MODELMATRIX = mat4.translate( MODELMATRIX, [2.0,1,0.0]);
    // MODELMATRIX = mat4.rotateY( MODELMATRIX, 3.14 * 0.0);
     MODELMATRIX = mat4.scale( MODELMATRIX, [1.0,1.0,1.0]);

    device.queue.writeBuffer(uBuffers.uniformBufferMatrix, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBuffers.uniformBufferMatrix, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
   
    device.queue.writeBuffer(uBuffers.instanceBuffer, 0, MODELMATRIX_ARRAY); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBuffers.instanceNormalBuffer, 0, NORMALMATRIX_ARRAY); // и так дале прибавляем 64 к offset
   
    device.queue.writeBuffer(uBuffers.instanceBufferRadius, 0, new Float32Array(radiuses)); 
    device.queue.writeBuffer(uBuffers.innstanceBufferCount, 0, new Uint32Array([instance_count])); 

    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      sampleCount,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  
  
    const textureMSAA = device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount,
      format: format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const textureView = textureMSAA.createView();

    const renderPassDescription =  {
      colorAttachments: [
        {
          view: textureView, //  Assigned later
          resolveTarget: undefined,
          storeOp: "store", //ХЗ
          clearValue: {r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
          loadOp: 'clear',       
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthLoadOp :"clear",
          depthClearValue : 1.0,
          depthStoreOp: "store",      
      }
    };

 
  

// Animation   
let sign = -1.0;
let time_old=0; 

window.addEventListener("keydown", () => sign = 0.9);
window.addEventListener("keyup", () => sign = -2);

 async function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt = time - time_old;
      time_old = time;
      camera.setDeltaTime(dt);
      //--------------------------------------------------
      world.step();
      //sign *= 0.5; 

      bodies.forEach((body, i) => {

        let clone = Object.assign({}, body.translation());
        centers[i][0] = clone.x;
        centers[i][1] = clone.y;
        centers[i][2] = clone.z;
   
        centers[i] = vec3.mulScalar(centers[i] , sign * .1);

        body.applyImpulse({x: centers[i][0], y: centers[i][1], z: centers[i][2] }, true);
      })
     
      //------------------MATRIX EDIT---------------------
     
      let k = 0;
      for (let i = 0; i < instance_count ; i++) {
                            
            mat4.identity(MODELMATRIX);
           // const r = bodies[i].translation();
            let clone = Object.assign({},  bodies[i].translation());

            const s = radiuses[i];
           
          
            MODELMATRIX = mat4.translate(MODELMATRIX, [clone.x, clone.y, clone.z]);
            MODELMATRIX = mat4.scale(MODELMATRIX,vec3.set(s,s,s));
              
            MODELMATRIX_ARRAY.set(MODELMATRIX, (k) * 16);
            
            NORMALMATRIX = mat4.transpose(MODELMATRIX);
            NORMALMATRIX = mat4.invert(MODELMATRIX);
           
            NORMALMATRIX_ARRAY.set(NORMALMATRIX, (k) * (16));
            k++;

            INSTANSPOSITION_ARRAY.set([clone.x, clone.y, clone.z, 1.0], i * 4);           
      }
   
      //--------------------------------------------------
      device.queue.writeBuffer(uBuffers.instanceBuffer, 0, MODELMATRIX_ARRAY); // и так дале прибавляем 64 к offset
      device.queue.writeBuffer(uBuffers.instanceNormalBuffer, 0, NORMALMATRIX_ARRAY); // и так дале прибавляем 64 к offset
      
      device.queue.writeBuffer(uBuffers.uniformBufferMatrix, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(uBuffers.uniformBufferMatrix, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
     
      let VIEWMATRIXinvert = mat4.invert(camera.vMatrix); 
      let PROJMATRIXinvert = mat4.invert(camera.pMatrix);
      device.queue.writeBuffer(uBuffers.uniformBufferInversMatrix, 0, PROJMATRIXinvert); // и так дале прибавляем 64 к offset
      device.queue.writeBuffer(uBuffers.uniformBufferInversMatrix, 64, VIEWMATRIXinvert); // и так дале прибавляем 64 к offset
      
      device.queue.writeBuffer(uBuffers.uniformCommon, 0, camera.eye); 
     
      device.queue.writeBuffer(uBuffers.instanceBufferPosition, 0, INSTANSPOSITION_ARRAY); 

      const commandEncoder = device.createCommandEncoder();
        
     
      const resolveTarget = context.getCurrentTexture().createView();

      //Rastr
      renderPassDescription.colorAttachments[0].resolveTarget = resolveTarget;  
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, modelSphere.vertexBuffer);
      renderPass.setVertexBuffer(1, modelSphere.uvBuffer);
      renderPass.setVertexBuffer(2, modelSphere.normalBuffer);
      renderPass.setIndexBuffer(modelSphere.indexBuffer, "uint32");
      renderPass.setBindGroup(0, pipeline.BindGroup.uniformBindGroup);
      renderPass.setBindGroup(1, pipeline.BindGroup.uniformInstansBindGroup);
      renderPass.drawIndexed(modelSphere.index.length,instance_count, 0, 0, 0);
     
      //RayTracing
      renderPass.setPipeline(pipelineRayTracing);  
      renderPass.setBindGroup(0, pipelineRayTracing.BindGroup.uniformBindGroup); 
      renderPass.setBindGroup(1, pipelineRayTracing.BindGroup.uniformInstansPosition);  
      renderPass.setBindGroup(2, pipelineRayTracing.BindGroup.uniformCubeTexture);      
      renderPass.draw(6); 
      
      renderPass.end();
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();