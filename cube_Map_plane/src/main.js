import {
  mat4,
} from '../../common/wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initResurse } from './initResurse.js';
import { shader } from './shaders/shaderCubeMap.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initPipeline } from './initPipeline.js';

async function main() {
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(false);
  //---------------------------------------------------
  //initResurse
  const {texture } = await initResurse(device);
  //---------------------------------------------------
  //initBuffers
  const {uBuffers} = await initUniformBuffers(device);
  const {pipeline } = await initPipeline(device,format,shader,uBuffers, texture);
  //---------------------------------------------------
  //INIT MATRIX  
  let INVERSE_PV_MATRIX = mat4.identity();
  let camera = new Camera(canvas);

  //---------------------------------------------------
  //INIT renderPassDescription  
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
        clearValue: { r: 0.0, g: 0.5, b: 0.3, a: 1.0 },
        loadOp: 'clear',
        storeOp: "store", 
      },],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",       
    }
  };


  mat4.mul(camera.pMatrix, camera.vMatrix, INVERSE_PV_MATRIX)
  device.queue.writeBuffer(uBuffers.uniformBuffer, 0, mat4.inverse(INVERSE_PV_MATRIX, INVERSE_PV_MATRIX)); // и так дале прибавляем 64 к offset

  // Animation   
  let time_old = 0;
  function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------
    camera.setDeltaTime(dt);
    //------------------MATRIX EDIT---------------------
    mat4.mul(camera.pMatrix, camera.vMatrix, INVERSE_PV_MATRIX)
    device.queue.writeBuffer(uBuffers.uniformBuffer, 0, mat4.inverse(INVERSE_PV_MATRIX, INVERSE_PV_MATRIX)); // и так дале прибавляем 64 к offset

    const commandEncoder = device.createCommandEncoder();
    textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, pipeline.bindGroup.uniformBindGroup);
    renderPass.draw(6);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(animate);
  };
  animate(0);
}

main();