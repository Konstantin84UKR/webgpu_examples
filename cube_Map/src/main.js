import {
  mat4
} from './../../common/wgpu-matrix.module.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initResurse } from './initResurse.js';
import { initVertexBuffers } from './initVertexBuffers.js';
import { shader } from './shaders/shaderCubeMap.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initPipeline } from './initPipeline.js';

async function main() {
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(false);
  //---------------------------------------------------
  //initResurse
  const {cube,texture } = await initResurse(device);
  //---------------------------------------------------
  //initBuffers
  await initVertexBuffers(device, cube);  
  const {uBuffers} = await initUniformBuffers(device);
  const {pipeline } = await initPipeline(device,format,shader,cube,uBuffers, texture);

  //---------------------------------------------------
  //INIT MATRIX
   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.identity(); 
    let PROJMATRIX = mat4.identity();
    
    let fovy = 40 * Math.PI / 180;
    PROJMATRIX = mat4.perspective(fovy, canvas.width/ canvas.height, 1, 25);
    VIEWMATRIX = mat4.lookAt([0.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]);
//---------------------------------------------------
//INIT renderPassDescriptio

    let textureView = context.getCurrentTexture().createView();
    
    let depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    }); 

    const renderPassDescription = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',        
          storeOp: "store", 
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthLoadOp :"clear",
          depthClearValue :1.0,
          depthStoreOp: "store",       
      }
    };

  MODELMATRIX = mat4.scale(MODELMATRIX, [10.0, 10.0, 10.0]); 

  device.queue.writeBuffer(uBuffers.uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBuffers.uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBuffers.uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
 
// Animation   
let time_old=0; 
  function animate(time) {
      
      //-----------------TIME-----------------------------
      let dt=time-time_old;
      time_old=time;
      //------------------MATRIX EDIT---------------------
      MODELMATRIX = mat4.rotateY( MODELMATRIX, dt * 0.0001);
      MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002 * Math.sin(time * 0.001));
      //--------------------------------------------------
      device.queue.writeBuffer(uBuffers.uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

      const commandEncoder = device.createCommandEncoder();
      textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
        
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, cube.vertexBuffer);
      renderPass.setBindGroup(0, pipeline.bindGroup.uniformBindGroup);
      renderPass.draw(cube.cubeVertexCount);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();