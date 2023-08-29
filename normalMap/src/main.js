import {
  mat4,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { initResurse } from './initResurse.js';
import { initBuffers } from './initBuffers.js';
import { getShaderCode } from './getShaderCode.js';
import { initPipeline } from './initPipeline.js';

console.log(mat4);

async function initScene(state) {
  // -- initWebGPU -- //
  const { device, context, format, size, canvas } = await initWebGPU();

  // -- InitResurse -- //
  const { model, plane, textures, sampler } = await initResurse(device);

  // -- Просто вынес тест шейдеров в другой файл -- //
  const { shaderShadow, shader } = await getShaderCode();

  // -- Выделяем память под буферы и заполняем их данными Моделей 
  // -- Для Юниформ буфером просто выдяляем память
  const { uBiffers } = await initBuffers(device, model, plane);

  const { shadowPipelineGroup, pipelineMainGroup } = await initPipeline(
    device, canvas, format, uBiffers,
    shader, textures, sampler, shaderShadow)

  // --create uniform data

  let MODELMATRIX = mat4.identity();
  let MODELMATRIX_PLANE = mat4.identity();
  let VIEWMATRIX = mat4.identity();
  let PROJMATRIX = mat4.identity();

  let VIEWMATRIX_SHADOW = mat4.identity();
  let PROJMATRIX_SHADOW = mat4.identity();
  let eyePosition = [3, 10, 2.0];
  VIEWMATRIX = mat4.lookAt(eyePosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

  PROJMATRIX = mat4.identity();
  let fovy = 40 * Math.PI / 180;
  PROJMATRIX = mat4.perspective(fovy, canvas.width / canvas.height, 1, 25);


  let camera = new Camera(canvas);
  camera.setPosition([0.0, 5.0, 10.0]);
  camera.setLook([0.0, -0.5, -1.0])

  //let eyePosition = [10, 10, 10.0]; 
  let lightPosition = new Float32Array([5.0, 5.0, 5.0]);
  VIEWMATRIX_SHADOW = mat4.lookAt(lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);

  const MATRIXGroup = {
    MODELMATRIX,
    MODELMATRIX_PLANE,
    VIEWMATRIX,
    PROJMATRIX,
    VIEWMATRIX_SHADOW,
    PROJMATRIX_SHADOW,
    lightPosition,
    eyePosition,
    camera
  }

  state.device = device;
  state.context = context;
  state.format = format;
  state.size = size;
  state.uBiffers = uBiffers;
  state.shadowPipelineGroup = shadowPipelineGroup;
  state.pipelineMainGroup = pipelineMainGroup;
  state.plane = plane;
  state.model = model;
  state.sampler = sampler;
  state.MATRIXGroup = MATRIXGroup;
  
  return state;
}

async function drawScene(state) {

  const {
    device,
    context,
    format,
    size,
    canvas,
    uBiffers,
    shadowPipelineGroup,
    pipelineMainGroup,
    model,
    plane,
    MATRIXGroup,
  } = state

  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, MATRIXGroup.PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, MATRIXGroup.VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64 + 64, MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset
  //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(MATRIXGroup.camera.eye));
  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, MATRIXGroup.lightPosition);

  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, MATRIXGroup.PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64, MATRIXGroup.VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64 + 64, MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer1, 0, new Float32Array(1.0, 1.0, 1.0));


  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined,
        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
        loadOp: 'clear',
        storeOp: "store", //ХЗ
      },],
    depthStencilAttachment: {
      view: pipelineMainGroup.depthView,
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
      view: shadowPipelineGroup.depthView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  };

  // Animation   
  let time_old = 0;
  async function renderLoop(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------
    MATRIXGroup.camera.setDeltaTime(dt);
    //------------------MATRIX EDIT---------------------
    MATRIXGroup.MODELMATRIX = mat4.rotateY(MATRIXGroup.MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);

    //--------------------------------------------------

    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, MATRIXGroup.camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64, MATRIXGroup.camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64 + 64, MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset
    //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64 + 64, MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(MATRIXGroup.camera.eye));

    const commandEncoder = device.createCommandEncoder();

    // SHADOW

    const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
    renderPassShadow.setPipeline(shadowPipelineGroup.pipeline);
    renderPassShadow.setVertexBuffer(0, model.vertexBuffer);
    renderPassShadow.setVertexBuffer(1, model.uvBuffer);
    renderPassShadow.setVertexBuffer(2, model.normalBuffer);
    renderPassShadow.setVertexBuffer(3, model.tangentBuffer);
    renderPassShadow.setVertexBuffer(4, model.bitangentBuffer);
    renderPassShadow.setIndexBuffer(model.indexBuffer, "uint32");
    renderPassShadow.setBindGroup(0, shadowPipelineGroup.bindGroup.shadowGroup0);
    renderPassShadow.drawIndexed(model.index.length);

    renderPassShadow.setVertexBuffer(0, plane.vertexBuffer);
    renderPassShadow.setVertexBuffer(1, plane.uvBuffer);
    renderPassShadow.setVertexBuffer(2, plane.normalBuffer);
    renderPassShadow.setVertexBuffer(3, plane.tangentBuffer);
    renderPassShadow.setVertexBuffer(4, plane.bitangentBuffer);
    renderPassShadow.setIndexBuffer(plane.indexBuffer, "uint32");
    renderPassShadow.setBindGroup(0, shadowPipelineGroup.bindGroup.shadowGroup0);
    renderPassShadow.drawIndexed(plane.index.length);

    renderPassShadow.end();
    // MAIN 

    const textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipelineMainGroup.pipeline);
    renderPass.setVertexBuffer(0, model.vertexBuffer);
    renderPass.setVertexBuffer(1, model.uvBuffer);
    renderPass.setVertexBuffer(2, model.normalBuffer);
    renderPass.setVertexBuffer(3, model.tangentBuffer);
    renderPass.setVertexBuffer(4, model.bitangentBuffer);
    renderPass.setIndexBuffer(model.indexBuffer, "uint32");
    renderPass.setBindGroup(0, pipelineMainGroup.bindGroup.uniformBindGroup0);
    renderPass.setBindGroup(1, pipelineMainGroup.bindGroup.uniformBindGroup1);
    renderPass.drawIndexed(model.index.length);

    renderPass.setVertexBuffer(0, plane.vertexBuffer);
    renderPass.setVertexBuffer(1, plane.uvBuffer);
    renderPass.setVertexBuffer(2, plane.normalBuffer);
    renderPass.setVertexBuffer(3, plane.tangentBuffer);
    renderPass.setVertexBuffer(4, plane.bitangentBuffer);
    renderPass.setIndexBuffer(plane.indexBuffer, "uint32");
    renderPass.setBindGroup(0, pipelineMainGroup.bindGroup.uniformBindGroup0);
    renderPass.setBindGroup(1, pipelineMainGroup.bindGroup.uniformBindGroup1);
    renderPass.drawIndexed(plane.index.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);


    window.requestAnimationFrame(renderLoop);
  };
  renderLoop(0);

}

async function main() {

  const state = {
    device: null,
    context: null,
    format: null,
    size: null,
    canvas: null,
    uBiffers: null,
    shadowPipelineGroup: null,
    pipelineMainGroup: null,
    model: null,
    plane: null,
    MATRIXGroup: null,
  }

  //INIT
  await initScene(state);
  //DRAW  
  drawScene(state);

}

main();
