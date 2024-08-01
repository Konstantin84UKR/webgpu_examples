import {
  mat4,vec3
} from './wgpu-matrix.module.js';
import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';

import { initUniformBuffers } from './initUniformBuffers.js';
import { initVertexBuffers } from './initVertexBuffers.js';
import { initResurse } from './initResurse.js';

import { loaderCubeTexture } from './loaderCubeTexture.js';

import { initPipeline as  initShadowPipeline} from './pipelineShadow/initPipeline.js';
import { initPipeline as  initPBRPipeline} from './pipelinePBR/initPipeline.js';
import { initPipeline as  initCubeMapPipeline } from './pipelineCubeMap/initPipeline.js';

async function main() {
  //---------------------------------------------------
  //initWebGPU
  const { device, context, format, canvas} = await initWebGPU(false);
  //initResurse
  const texture_CUBE = await loaderCubeTexture(device) 
  const { RES } = await initResurse(device);
  const { uBiffers } = await initUniformBuffers(device);  

  //await initVertexBuffers(device, modelForRender);
  await initVertexBuffers(device, RES.MODELs.meshSphere);
  ///**  Шейдеры тут все понятно более мение. */  

  let MODELMATRIX = mat4.identity();
  //MODELMATRIX = mat4.translation([0, 0, -2.0]);
  let MODELMATRIX_PLANE = mat4.identity();
  let MODELMATRIX_CUBEMAP = mat4.identity();

  MODELMATRIX_PLANE = mat4.rotationX(Math.PI * 0.5);

  let camera = new Camera(canvas, vec3.create(0.0, 0.0, 3.5));
   
  const lightPosition = [-10, 10, 10.0];//new Float32Array(camera.eye);
  const VIEWMATRIX_SHADOW = mat4.lookAt(lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  const PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);


   //******************
  // CUBEMAP END 
  //******************
  
  //*********************************************//
  //** настраиваем конвейер рендера 
  //** настраиваем шейдеры указав исходник,точку входа, данные буферов
  //** arrayStride количество байт на одну вершину */
  //** attributes настриваем локацию формат и отступ от начала  arrayStride */
  //** primitive указываем тип примитива для отрисовки*/
  //** depthStencil настраиваем буффер глубины*/

  const shadowPipeline = await initShadowPipeline(device,uBiffers);
  const pipelinePBR = await initPBRPipeline(device, context, canvas, format,uBiffers,shadowPipeline,RES,texture_CUBE);
  const pipelineCubeMap = await initCubeMapPipeline(device, context, canvas, format,uBiffers,shadowPipeline,RES,texture_CUBE);
  
  //-------------------- TEXTURE ---------------------
  // Создаем саму текстуру и MipMap на GPU
  // 1) Создаем текстуру из файла картинки 
  // 2) загружаем картинку с диска и создаем из нее Bitmap 
  // 3) Создаем текстуру из источника
  // 4) вычисляем необходимое количество мип урочней
  // 5) копируем данные из источника в текстуру (отправляем на GPU)
  // 6) Генерируем мип уровни
  
  //--------------------------------------------------
    //******************
  // CUBEMAP
  //******************

  //TEXTURE 
  //Создаем картинку и загрудаем в нее данные из файла

  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
  //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, new Float32Array(lightPosition.flat(),1.0));

  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

  MODELMATRIX_CUBEMAP = mat4.scale( MODELMATRIX_CUBEMAP, [10.0, 10.0, 10.0]); 

  device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 64 + 64, MODELMATRIX_CUBEMAP); // и так дале прибавляем 64 к offset


  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: 'clear',
        storeOp: "store", //ХЗ
      },],
    depthStencilAttachment: {
      view: pipelinePBR.dataPipeline.depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  const renderPassDescriptionShadow = {
    colorAttachments: [],
    depthStencilAttachment: {
      view: shadowPipeline.dataPipeline.shadowDepthView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  };

  // Animation   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------

    //------------------MATRIX EDIT---------------------
     MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0001);
    //MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    //MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);
    camera.setDeltaTime(dt);
    //--------------------------------------------------

    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

    const eyes = [camera.eye[0], camera.eye[1], camera.eye[2], 1];
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(eyes));
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, new Float32Array(lightPosition.flat(),1.0));

   // MODELMATRIX_CUBEMAP = mat4.scale( MODELMATRIX, [10.0, 10.0, 10.0]); 
    device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uBiffers.uniformBuffer_CUBEMAP, 64 + 64, MODELMATRIX_CUBEMAP); // и так дале прибавляем 64 к offset
  

    const commandEncoder = device.createCommandEncoder();
    // SHADOW

    const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
    renderPassShadow.setPipeline(shadowPipeline.pipeline);

    renderPassShadow.setVertexBuffer(0, RES.MODELs.modelForRender.vertexBuffer);
    renderPassShadow.setVertexBuffer(1, RES.MODELs.modelForRender.uvBuffer);
    renderPassShadow.setVertexBuffer(2, RES.MODELs.modelForRender.normalBuffer);
    renderPassShadow.setVertexBuffer(3, RES.MODELs.modelForRender.tangentBuffer);
    renderPassShadow.setIndexBuffer(RES.MODELs.modelForRender.indexBuffer, "uint16");
    renderPassShadow.setBindGroup(0,shadowPipeline.dataPipeline.shadowGroup);
    renderPassShadow.drawIndexed(RES.MODELs.modelForRender.indexCount);

    renderPassShadow.end();

    // MAIN 
    const textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipelinePBR.pipeline);
    
    renderPass.setVertexBuffer(0, RES.MODELs.meshSphere.vertexBuffer);
    renderPass.setVertexBuffer(1, RES.MODELs.meshSphere.uvBuffer);
    renderPass.setVertexBuffer(2, RES.MODELs.meshSphere.normalBuffer);
    renderPass.setVertexBuffer(3, RES.MODELs.meshSphere.tangentBuffer);
    renderPass.setIndexBuffer(RES.MODELs.meshSphere.indexBuffer, "uint32");
    renderPass.setBindGroup(0, pipelinePBR.dataPipeline.uniformBindGroup);
    renderPass.setBindGroup(1, pipelinePBR.dataPipeline.uniformBindGroup1);
    renderPass.setBindGroup(2, pipelinePBR.dataPipeline.uniformBindGroup_IBL_PBR);
    renderPass.setBindGroup(3, pipelinePBR.dataPipeline.uniformBindGroup_CUBEMAP_PBR);
    renderPass.drawIndexed(RES.MODELs.meshSphere.indexCount );

    renderPass.setVertexBuffer(0, RES.MODELs.modelForRender.vertexBuffer);
    renderPass.setVertexBuffer(1, RES.MODELs.modelForRender.uvBuffer);
    renderPass.setVertexBuffer(2, RES.MODELs.modelForRender.normalBuffer);
    renderPass.setVertexBuffer(3, RES.MODELs.modelForRender.tangentBuffer);
    renderPass.setIndexBuffer( RES.MODELs.modelForRender.indexBuffer, "uint16");
    renderPass.setBindGroup(0, pipelinePBR.dataPipeline.uniformBindGroup);
    renderPass.setBindGroup(1, pipelinePBR.dataPipeline.uniformBindGroup1);
    renderPass.setBindGroup(2, pipelinePBR.dataPipeline.uniformBindGroup_IBL_PBR);
    renderPass.setBindGroup(3, pipelinePBR.dataPipeline.uniformBindGroup_CUBEMAP_PBR);
    renderPass.drawIndexed(RES.MODELs.modelForRender.indexCount);

    // CUBEMAP
    renderPass.setPipeline(pipelineCubeMap.pipeline);

    renderPass.setVertexBuffer(0, pipelineCubeMap.dataPipeline.vertexBuffer);
    renderPass.setBindGroup(0, pipelineCubeMap.dataPipeline.uniformBindGroup_CUBEMAP);
    renderPass.draw(36);

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);


    window.requestAnimationFrame(animate);
  };
  animate(0);
}

main();
