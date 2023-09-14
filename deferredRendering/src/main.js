
import {
  mat4, vec3,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { shaderPostEffect } from './postEffectRender/shaders/shaderPostEffect.js';
import { shadergBufferPass } from './gBufferRender/shader/shadergBufferPass.js';
import { shaderDeferredRendering } from './deferredRender/shaders/shaderDeferredRendering.js';
import { shaderLigthHelpers } from './forvardRender/shaders/shaderLigthHelpers.js';
import { initResurse } from './initResurse.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initVertexBuffers } from './initVertexBuffers.js';
import { initPipeline as initPostEffectPipeline } from './postEffectRender/initPipeline.js';
import { initPipeline as initPipelineDeferredRender } from './deferredRender/initPipeline.js';
import { initPipeline as initPipelineGBuffer} from './gBufferRender/initPipeline.js';

import { initPipeline as initPipelineForvardRender } from './forvardRender/initPipeline.js';
import { initBuffers as initBuffersForvardRender} from './forvardRender/initBuffers.js';

async function main() {
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(false);
  //---------------------------------------------------
  //initResurse
  const { model, plane, texture, sampler , ligthHelper, bunny} = await initResurse(device);
  //---------------------------------------------------
  //initBuffers
  await initVertexBuffers(device, model);  
  await initVertexBuffers(device, plane);
  const { uBiffers } = await initUniformBuffers(device);  
  await initBuffersForvardRender(device, ligthHelper);
  //---------------------------------------------------
  //initMATRIX
  let MODELMATRIX = mat4.identity();
  let MODELMATRIX_PLANE = mat4.identity();
  let MODELMATRIX_ligthHelper = mat4.identity();
  let MODELMATRIX_ARRAY = new Float32Array(3 * (4 * 4));
  let LIGTHCOLOR_ARRAY = new Float32Array(3 * (4));
  let VIEWMATRIX = mat4.identity();
  let PROJMATRIX = mat4.identity();
  let VIEWMATRIX_SHADOW = mat4.identity();
  let PROJMATRIX_SHADOW = mat4.identity();

  VIEWMATRIX = mat4.lookAt([0.0, 5.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

  PROJMATRIX = mat4.identity();
  let fovy = 40 * Math.PI / 180;
  PROJMATRIX = mat4.perspective(fovy, canvas.width / canvas.height, 1, 25);

  let camera = new Camera(canvas);
  camera.setPosition([0.0, 5.0, 8.0]);
  camera.setLook([0.0, -0.5, -1.0])

  let eyePosition = [10, 10, 10.0];
  VIEWMATRIX_SHADOW = mat4.lookAt(eyePosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 15);

  let lightPosition = [
    new Float32Array([2.0, 2.0, 1.0]),
    new Float32Array([-2.0, 2.0, 1.0]),
    new Float32Array([0.0, 3.0, 0.0])
  ]

  let lightColor = [
    [1.0, 0.5, 0.1],
    [0.5, 0.0, 0.5],
    [0.1, 0.5, 0.9]
  ]
 


  const depthRangeRemapMatrix = mat4.identity();
  depthRangeRemapMatrix[10] = -1;
  depthRangeRemapMatrix[14] = 1;

  //---------------------------------------------------
  //initPipeline
  const { pipeline : pipelineGBuffer } = await initPipelineGBuffer(device, canvas, format, uBiffers, shadergBufferPass, texture, sampler,shaderDeferredRendering);
  const { pipeline : pipelineDeferredRender } = await initPipelineDeferredRender(device, canvas, format, uBiffers, pipelineGBuffer.gBufferTexture ,shaderDeferredRendering);
  const { pipeline : forvardRender_pipeline } = await initPipelineForvardRender(device, canvas, format, uBiffers,shaderLigthHelpers);
  //---------------------------------------------------
  //initRenderPassDescription
  const textureGBufferPass = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  let depthPipelineGBufferView = pipelineGBuffer.Depth.depthTexture.createView();

  const renderGBufferPassDescription = {
    colorAttachments: [   
      {
        view: textureGBufferPass.createView(),

        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
      {
        view: pipelineGBuffer.gBufferTexture[0].createView(),

        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
      {
        view: pipelineGBuffer.gBufferTexture[1].createView(),

        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }
     
    
    ],
   
    depthStencilAttachment: {
      view: depthPipelineGBufferView,  // "Обычная" текстура глубины
      depthClearValue: 0.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  };

  const textureDeferredRender = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  const deferredRenderPassDescription = {
    colorAttachments: [   
      {
        view: textureDeferredRender.createView(),

        clearValue: { r: 0.3, g: 0.4, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }    
    ],    
  };

  const postEffectRenderPassDescription = {  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
    colorAttachments: [{
      view: undefined,
      clearValue: { r: 0.3, g: 0.4, b: 0.4, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store' //хз
    }],
    depthStencilAttachment: {
      view: depthPipelineGBufferView,
      depthLoadOp: 'load', //  "load" 'clear'
      depthStoreOp: 'store',} // "store", "discard",
  };

  const { pipeline : pipeline_PostEffect } = await initPostEffectPipeline(device, canvas, format, shaderPostEffect, textureDeferredRender , sampler); // pipelineGBuffer.gBufferTexture[2] // textureMainScene2
  //--------------------------------------------------
  //BUFFERS EDIT
  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

  MODELMATRIX = mat4.translate(MODELMATRIX, vec3.set(0, 0.0, 0));
  MODELMATRIX = mat4.scale(MODELMATRIX, vec3.set(2.0,2.0,2.0));

  device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset

  MODELMATRIX_PLANE = mat4.translate(MODELMATRIX_PLANE, vec3.set(0, -1.0, 0));
  MODELMATRIX_PLANE = mat4.rotateX(MODELMATRIX_PLANE, -3.14*0.5);
  device.queue.writeBuffer(uBiffers.uniformBufferModel_2, 0, MODELMATRIX_PLANE); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
   
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)


  MODELMATRIX_ligthHelper = mat4.translate(MODELMATRIX_ligthHelper,new Float32Array([-2.0, 2.0, 1.0]));
  device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  
  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 0, new Float32Array([-2.0, 2.0, 1.0])); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 16, new Float32Array([0.0, 3.0, 0.0])); // следуюшая записать в буфер с отступом (offset = 16)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 32, new Float32Array([2.0, 2.0, 1.0])); // следуюшая записать в буфер с отступом (offset = 32)

  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 0, new Float32Array([lightColor[0],1.0].flat())); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 16, new Float32Array([lightColor[1],1.0].flat())); // следуюшая записать в буфер с отступом (offset = 16)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 32, new Float32Array([lightColor[2],1.0].flat())); // следуюшая записать в буфер с отступом (offset = 32)
  

  LIGTHCOLOR_ARRAY.set(lightColor[0], (0) * 4);
  LIGTHCOLOR_ARRAY.set(lightColor[1], (1) * 4);
  LIGTHCOLOR_ARRAY.set(lightColor[2], (2) * 4);

  device.queue.writeBuffer(uBiffers.instanceColorBuffer, 0, LIGTHCOLOR_ARRAY);

  // Animation   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------
    camera.setDeltaTime(dt);

    //------------------MATRIX EDIT---------------------
    MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);

    lightPosition[0] = new Float32Array([(Math.sin(time * 0.001) - 0.0) * 2.5,
                                         (Math.cos(time * 0.002) + 1.0) * 2.0 ,
                                         (Math.sin(time * 0.001) * Math.cos(time * 0.003)) * 2.5 ]);
    
    
    lightPosition[1] = new Float32Array([(Math.cos(time * 0.001) + 0.0) * 2.0 , 
                                        (Math.sin(time * 0.002) + 1.0) * 2.0,
                                        (Math.cos(time * 0.002) - 0.0) * 2.5 ]);


    lightPosition[2] = new Float32Array([(Math.cos(time * 0.0005) - 0.0) * 3.0 , 
                                         (Math.sin(time * 0.0015) + 5.0) * 0.5,
                                         (Math.sin(time * 0.0005) + 0.0) * 2.0]);
  
    //--------------------------------------------------
    //------------------BUFFER EDIT---------------------
    const reversZpMatrix = mat4.multiply(depthRangeRemapMatrix, camera.pMatrix);
    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

    device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));

    const cameraViewProj =  mat4.multiply(reversZpMatrix, camera.vMatrix);
    const cameraInvViewProj = mat4.invert(cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 0, cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 64, cameraInvViewProj);
   
    device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
   
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 0, lightPosition[0]); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 16, lightPosition[1]); // следуюшая записать в буфер с отступом (offset = 16)
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 32, lightPosition[2]); // следуюшая записать в буфер с отступом (offset = 32)

    for (let indexLigth = 0; indexLigth < 3; indexLigth++) {
      MODELMATRIX_ligthHelper = mat4.identity();
      MODELMATRIX_ligthHelper = mat4.translate(MODELMATRIX_ligthHelper, lightPosition[indexLigth]);

      MODELMATRIX_ARRAY.set(MODELMATRIX_ligthHelper, (indexLigth) * 4 * 4);
    }
       
    device.queue.writeBuffer(uBiffers.instanceBuffer, 0, MODELMATRIX_ARRAY);
    

    //RENDER
    const commandEncoder = device.createCommandEncoder();

    // SHADOW
    // TODO
    // GBufferPass 
    const renderGBufferPass = commandEncoder.beginRenderPass(renderGBufferPassDescription);

    renderGBufferPass.setPipeline(pipelineGBuffer);
   
    // renderGBufferPass.setVertexBuffer(0, model.vertexBuffer);
    // renderGBufferPass.setVertexBuffer(1, model.uvBuffer);
    // renderGBufferPass.setVertexBuffer(2, model.normalBuffer);
    // renderGBufferPass.setIndexBuffer(model.indexBuffer, "uint32");
    // renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    // renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2);
    // renderGBufferPass.drawIndexed(model.index.length);

    renderGBufferPass.setVertexBuffer(0, plane.vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, plane.uvBuffer);
    renderGBufferPass.setVertexBuffer(2, plane.normalBuffer);
    renderGBufferPass.setIndexBuffer(plane.indexBuffer, "uint32");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2_1);
    renderGBufferPass.drawIndexed(plane.index.length);


    renderGBufferPass.setVertexBuffer(0, bunny.vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, bunny.uvBuffer);
    renderGBufferPass.setVertexBuffer(2, bunny.normalBuffer);
    renderGBufferPass.setIndexBuffer(bunny.indexBuffer, "uint16");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2);
    renderGBufferPass.drawIndexed(bunny.indexCount);

    renderGBufferPass.end();

    //DeferredRender 
    const renderPass = commandEncoder.beginRenderPass(deferredRenderPassDescription);

    renderPass.setPipeline(pipelineDeferredRender);
    renderPass.setBindGroup(0, pipelineDeferredRender.BindGroup.gBufferTexturesBindGroup);
    renderPass.setBindGroup(1, pipelineDeferredRender.BindGroup.gBufferUniformBindGroup);
    renderPass.setBindGroup(2, pipelineDeferredRender.BindGroup.gBufferCameraBindGroup);
    renderPass.draw(6);
    renderPass.end();

    // _PostEffect 
    const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    postEffectRenderPassDescription.colorAttachments[0].view = textureView_PostEffect;
    const renderPass_PostEffect = commandEncoder.beginRenderPass(postEffectRenderPassDescription);
   
    renderPass_PostEffect.setBindGroup(0, pipeline_PostEffect.BindGroup.bindGroup_PostEffect);
    renderPass_PostEffect.setPipeline(pipeline_PostEffect); // подключаем наш pipeline
    renderPass_PostEffect.draw(6);
  
    renderPass_PostEffect.setPipeline(forvardRender_pipeline);
    renderPass_PostEffect.setVertexBuffer(0, ligthHelper.vertexBuffer);
    renderPass_PostEffect.setIndexBuffer(ligthHelper.indexBuffer, "uint32");
    renderPass_PostEffect.setBindGroup(0, forvardRender_pipeline.BindGroup.forvardRender_uniformBindGroup);
    renderPass_PostEffect.drawIndexed(ligthHelper.index.length,3,0,0,0);         
    
    renderPass_PostEffect.end();

    device.queue.submit([commandEncoder.finish()]);
    window.requestAnimationFrame(animate);
  };
  animate(0);
}

main();