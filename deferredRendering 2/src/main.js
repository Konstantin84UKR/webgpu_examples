
import {
  mat4, vec3,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { shaderPostEffect } from './shaders/shaderPostEffect.js';
import { shadergBufferPass } from './shaders/shadergBufferPass.js';
import { shaderDeferredRendering } from './shaders/shaderDeferredRendering.js';
import { shaderLigthHelpers } from './shaders/shaderLigthHelpers.js';
import { initResurse } from './initResurse.js';
import { initBuffers } from './initBuffers.js';
import { initPostEffect } from './initPostEffect.js';
import { initPipeline } from './initPipeline.js';
import { initPipelineForvardRender } from './initPipelineForvardRender.js';

async function main() {

  const { device, context, format, canvas} = await initWebGPU(false);
  //---------------------------------------------------
  const { model, plane, texture, sampler ,ligthHelper} = await initResurse(device);
  //---------------------------------------------------
  const { uBiffers } = await initBuffers(device, model, plane, ligthHelper);
  //---------------------------------------------------

  let MODELMATRIX = mat4.identity();
  let MODELMATRIX_PLANE = mat4.identity();
  let MODELMATRIX_ligthHelper = mat4.identity();
  let VIEWMATRIX = mat4.identity();
  let PROJMATRIX = mat4.identity();
  let MODELMATRIX_ARRAY = new Float32Array(3 * (4 * 4));
  let LIGTHCOLOR_ARRAY = new Float32Array(3 * (4));


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
 


  const depthRangeRemapMatrix = mat4.identity();
  depthRangeRemapMatrix[10] = -1;
  depthRangeRemapMatrix[14] = 1;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  const { pipelineGBuffer, pipeline } = await initPipeline(device, canvas, format, uBiffers, shadergBufferPass, texture, sampler,shaderDeferredRendering);
  const { forvardRender_pipeline } = await initPipelineForvardRender(device, canvas, format, uBiffers,shaderLigthHelpers);
  //Создать tекстуру для Рендера
  // Создаем саму текстуру
  const textureMainScene = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  let depthPipelineView = pipelineGBuffer.Depth.depthTexture.createView();

  const renderGBufferPassDescription = {
    colorAttachments: [   
      {
        view: textureMainScene.createView(),

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
     // ,  
    
    ],
   
    depthStencilAttachment: {
      view: depthPipelineView,  // "Обычная" текстура глубины
      depthClearValue: 0.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  //------
  const textureMainScene2 = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  const renderPassDescription2 = {
    colorAttachments: [   
      {
        view: textureMainScene2.createView(),

        clearValue: { r: 0.3, g: 0.4, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }    
    ],

    // depthStencilAttachment: {
    //   view: pipeline.depthTexture.createView(),  // "Обычная" текстура глубины
    //   depthClearValue: 0.0,
    //   depthLoadOp: 'clear',
    //   depthStoreOp: 'store',
    //   // stencilLoadValue: 0,
    //   // stencilStoreOp: "store"
    // }
  };




  const renderPass_PostEffect_Description = {  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
    colorAttachments: [{
      view: undefined,
      clearValue: { r: 0.3, g: 0.4, b: 0.4, a: 1.0 },
      loadOp: 'clear',
      storeOp: 'store' //хз
    }],
    depthStencilAttachment: {
      view: depthPipelineView,
     // depthClearValue: 1.0, // мы загружам 'load' данные из готовой карты грубины
      depthLoadOp: 'load', //  "load" 'clear'
      depthStoreOp: 'store',} // "store", "discard",
  };

  const { pipeline_PostEffect } = await initPostEffect(device, canvas, format, shaderPostEffect,  textureMainScene2, sampler); // pipelineGBuffer.gBufferTexture[2] // textureMainScene2
  //-------------------------------------------------------------------------------------------------------

  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

  MODELMATRIX = mat4.translate(MODELMATRIX, vec3.set(0, 1.5, 0));

  device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset
  device.queue.writeBuffer(uBiffers.uniformBufferModel_2, 0, MODELMATRIX_PLANE); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
   
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)


  MODELMATRIX_ligthHelper = mat4.translate(MODELMATRIX_ligthHelper,new Float32Array([-2.0, 2.0, 1.0]));
  device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64+64, MODELMATRIX_ligthHelper); // следуюшая записать в буфер с отступом (offset = 64)

  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 0, new Float32Array([-2.0, 2.0, 1.0])); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 16, new Float32Array([0.0, 3.0, 0.0])); // следуюшая записать в буфер с отступом (offset = 16)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 32, new Float32Array([2.0, 2.0, 1.0])); // следуюшая записать в буфер с отступом (offset = 32)

  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 0, new Float32Array([1.0, 0.0, 0.0,1.0])); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 16, new Float32Array([0.0, 1.0, 0.0,1.0])); // следуюшая записать в буфер с отступом (offset = 16)
  device.queue.writeBuffer(uBiffers.fragmentUniformLightColorBuffer, 32, new Float32Array([0.0, 0.0, 1.0,1.0])); // следуюшая записать в буфер с отступом (offset = 32)
  

  LIGTHCOLOR_ARRAY.set([1.0, 0.0, 0.0], (0) * 4);
  LIGTHCOLOR_ARRAY.set([0.0, 1.0, 0.0], (1) * 4);
  LIGTHCOLOR_ARRAY.set([0.0, 0.0, 1.0], (2) * 4);

  device.queue.writeBuffer(uBiffers.instanceColorBuffer, 0, LIGTHCOLOR_ARRAY);
  // Animation   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;

    //--------------------------------------------------
    camera.setDeltaTime(dt);
    //------------------MATRIX EDIT---------------------
    MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);

    lightPosition[0] = new Float32Array([(Math.sin(time * 0.001) - 0.0) * 2.0,
                                         (Math.cos(time * 0.001) + 1.0) * 2.0 ,
                                          2.0 ]);
    
    
    lightPosition[1] = new Float32Array([0.0, 
                                        (Math.sin(time * 0.002) + 1.0) * 2.0,
                                        (Math.cos(time * 0.002) - 0.0) * 2.5 ]);


    lightPosition[2] = new Float32Array([(Math.cos(time * 0.0005) - 0.0) * 3.0 , 
                                           2.0,
                                         (Math.sin(time * 0.0005) + 0.0) * 2.0]);

    //--------------------------------------------------
    const reversZpMatrix = mat4.multiply(depthRangeRemapMatrix, camera.pMatrix);
    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

    device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));

    const cameraViewProj =  mat4.multiply(reversZpMatrix, camera.vMatrix);
    const cameraInvViewProj = mat4.invert(cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 0, cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 64, cameraInvViewProj);
    
    MODELMATRIX_ligthHelper = mat4.identity();
    MODELMATRIX_ligthHelper = mat4.translate(MODELMATRIX_ligthHelper, lightPosition[2]);

    device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    //device.queue.writeBuffer(uBiffers.ligthHelper_uniformBuffer, 64+64, MODELMATRIX_ligthHelper); // следуюшая записать в буфер с отступом (offset = 64)
  
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 0, lightPosition[0]); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 16, lightPosition[1]); // следуюшая записать в буфер с отступом (offset = 16)
    device.queue.writeBuffer(uBiffers.fragmentUniformLightPositionBuffer, 32, lightPosition[2]); // следуюшая записать в буфер с отступом (offset = 32)

    for (let indexLigth = 0; indexLigth < 3; indexLigth++) {
      MODELMATRIX_ligthHelper = mat4.identity();
      MODELMATRIX_ligthHelper = mat4.translate(MODELMATRIX_ligthHelper, lightPosition[indexLigth]);

      MODELMATRIX_ARRAY.set(MODELMATRIX_ligthHelper, (indexLigth) * 4 * 4);
    }
   
    
    device.queue.writeBuffer(uBiffers.instanceBuffer, 0, MODELMATRIX_ARRAY);
    

    const commandEncoder = device.createCommandEncoder();

    // SHADOW
    //TODO


    // MAIN 
    // const textureView = context.getCurrentTexture().createView();
    // renderPassDescription.colorAttachments[0].view = textureView;

    const renderGBufferPass = commandEncoder.beginRenderPass(renderGBufferPassDescription);

    renderGBufferPass.setPipeline(pipelineGBuffer);
    renderGBufferPass.setVertexBuffer(0, model.vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, model.uvBuffer);
    renderGBufferPass.setVertexBuffer(2, model.normalBuffer);
    renderGBufferPass.setIndexBuffer(model.indexBuffer, "uint32");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    //renderGBufferPassss.setBindGroup(1, pipeline.BindGroup.uniformBindGroup1);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2);
    renderGBufferPass.drawIndexed(model.index.length);
    renderGBufferPass.setVertexBuffer(0, plane.plane_vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, plane.plane_uvBuffer);
    renderGBufferPass.setVertexBuffer(2, plane.plane_normalBuffer);
    renderGBufferPass.setIndexBuffer(plane.plane_indexBuffer, "uint32");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    //renderGBufferPassss.setBindGroup(1, pipeline.BindGroup.uniformBindGroup1);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2_1);
    renderGBufferPass.drawIndexed(plane.index.length);
    renderGBufferPass.end();


    //RENDER 

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription2);

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, pipeline.BindGroup.gBufferTexturesBindGroup);
    renderPass.setBindGroup(1, pipeline.BindGroup.gBufferUniformBindGroup);
    renderPass.setBindGroup(2, pipeline.BindGroup.gBufferCameraBindGroup);
    renderPass.draw(6);
    renderPass.end();


    // _PostEffect 
    const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    renderPass_PostEffect_Description.colorAttachments[0].view = textureView_PostEffect;
    const renderPass_PostEffect = commandEncoder.beginRenderPass(renderPass_PostEffect_Description);
   
    renderPass_PostEffect.setBindGroup(0, pipeline_PostEffect.BindGroup.bindGroup_PostEffect);
    renderPass_PostEffect.setPipeline(pipeline_PostEffect); // подключаем наш pipeline
    renderPass_PostEffect.draw(6);
  
    renderPass_PostEffect.setPipeline(forvardRender_pipeline);
    renderPass_PostEffect.setVertexBuffer(0, ligthHelper.ligthHelper_vertexBuffer);
    renderPass_PostEffect.setIndexBuffer(ligthHelper.ligthHelper_indexBuffer, "uint32");
    renderPass_PostEffect.setBindGroup(0, forvardRender_pipeline.BindGroup.forvardRender_uniformBindGroup);
    renderPass_PostEffect.drawIndexed(ligthHelper.index.length,3,0,0,0);         
    
    renderPass_PostEffect.end();

    device.queue.submit([commandEncoder.finish()]);


    window.requestAnimationFrame(animate);
  };
  animate(0);
}

main();