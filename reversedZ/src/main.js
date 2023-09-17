import {
  mat4
} from './wgpu-matrix.module.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { shaderMain } from './shaders/shaderMain.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initPipeline } from './initPipeline.js';
import { initResurse } from './initResurse.js';
import { initVertexBuffers } from './initVertexBuffers.js';

import { initPipeline as initPipelinePostEffect } from './postEffectRender/initPipeline.js';
import { shaderPostEffect} from './postEffectRender/shaders/shaderPostEffect.js';


async function main() {
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(true);
  //initResurse
  const {cube} = await initResurse(device);
  //---------------------------------------------------
  //initBuffers
  await initVertexBuffers(device, cube);
  //---------------------------------------------------
  //initUniformBuffers
  const { uBuffers } = await initUniformBuffers(device);  
  //---------------------------------------------------
  //initUniformBuffers
  const { pipeline } = await initPipeline(device,format,uBuffers,shaderMain);  
  //---------------------------------------------------
  //initMATRIX
  let MODELMATRIX = mat4.identity();
  let VIEWMATRIX = mat4.identity(); 
  let PROJMATRIX = mat4.identity();
  
  VIEWMATRIX = mat4.lookAt([0.0, 0.0, 5.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  let fovy = 40 * Math.PI / 180;
  PROJMATRIX = mat4.perspective(fovy, canvas.width/ canvas.height, 1, 25);

  const depthRangeRemapMatrix = mat4.identity();
  depthRangeRemapMatrix[10] = -1;
  depthRangeRemapMatrix[14] = 1;

  //------------------------------------------------------------------------------
   
    const textureMainRender = device.createTexture({
      size: [canvas.width, canvas.height],
      format: format,
      usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT
    });
   
    let depthTextureMainRender = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage:GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.RENDER_ATTACHMENT
    }); 

    const renderPassDescription = {
      colorAttachments: [
        {
          view: textureMainRender.createView(),
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0 },        
          loadOp: 'clear',        
          storeOp: "store", 
        },],
        depthStencilAttachment: {
          view: depthTextureMainRender.createView(),        
          depthLoadOp :"clear",
         // depthClearValue : 0.0, // STEP 1 
          depthClearValue : 1.0, // STEP 1 
          depthStoreOp: "store",        
      }
    };

   
    //POST EFFECT
    const { pipeline : pipelinePostEffect  } = await initPipelinePostEffect(device, canvas, format, shaderPostEffect, textureMainRender , depthTextureMainRender);  
   
    let depthTexturePostEffect = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    }); 

    const postEffectRenderPassDescription = {  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
      colorAttachments: [{
        view: undefined,
        clearValue: { r: 0.3, g: 0.4, b: 0.4, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store' //хз
      }],
      depthStencilAttachment: {
        view: depthTexturePostEffect.createView(),
        depthClearValue :1.0,
        depthLoadOp: 'clear', //  "load" 'clear'
        depthStoreOp: 'store',} // "store", "discard",
    };       
    
   // const reversZpMatrix = mat4.multiply(depthRangeRemapMatrix, PROJMATRIX); // STEP 3
   // device.queue.writeBuffer(uBuffers.uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBuffers.uniformBuffer, 0, PROJMATRIX);
    device.queue.writeBuffer(uBuffers.uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
 

// Animation   
let time_old=0; 
  function animate(time) {
      
      //-----------------TIME-----------------------------
      let dt=time-time_old;
      time_old=time;
      //------------------MATRIX EDIT---------------------
      MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.001);
      MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.002);
      MODELMATRIX = mat4.rotateZ(MODELMATRIX, dt * 0.001);
      //--------------------------------------------------

      device.queue.writeBuffer(uBuffers.uniformBuffer, 64 + 64, MODELMATRIX); 

      const commandEncoder = device.createCommandEncoder();
      // const textureView = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
      // renderPassDescription.colorAttachments[0].view = textureView;
      
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, cube.vertexBuffer);
      renderPass.setIndexBuffer(cube.indexBuffer, "uint32");
      renderPass.setBindGroup(0, pipeline.BindGroup.uniformBindGroup);   
      renderPass.drawIndexed(cube.cube_index.length);
      renderPass.end();

      //POST EFFECT
      const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
      postEffectRenderPassDescription.colorAttachments[0].view = textureView_PostEffect;
      const renderPass_PostEffect = commandEncoder.beginRenderPass(postEffectRenderPassDescription);

      renderPass_PostEffect.setBindGroup(0, pipelinePostEffect.BindGroup.bindGroup_PostEffect);
      renderPass_PostEffect.setPipeline(pipelinePostEffect); 
      renderPass_PostEffect.draw(6);
      renderPass_PostEffect.end();

  
      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();