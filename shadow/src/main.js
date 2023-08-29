// 1. Карта теней
// 2. Явно указаны все лейауты в отличии от 'auto' 
// 3. Исправил матрицу нормалей убрал вектор перемешения.
// Это особенно заметно когда подымаешь модель над полом.
// По хорошему нужно отдельная матрица нормали.
// 4. Исправил блики. передаю каждый кадр полодение камеры для расчета вектора взгляда.
// 5. Инвертировал ось Z в буффере глубины. Для этого изменил значение очистки буффера на 0.0
// изменил функцию сравнения на 'greater' вместо 'less' 
// и умножаю матрицу перспективы на специальную матрицу для инверсии оси z.  
// 6. Для примера оставил рендер пасс для теней с обычный буффером глубины.
// 7. Алгоритм тональной компрессии Рейнхарда
// 8. Экспозиция тональной компрессии
// 9. Гамма-коррекция

import {
  mat4, vec3,
} from '../../common/wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { initResurse } from './initResurse.js';
import { initBuffers } from './initBuffers.js';
import { getShaderCode } from './getShaderCode.js';
import { initPipeline } from './initPipeline.js';


async function initScene(state){
  // -- initWebGPU -- //
  const { device, context, format, size , canvas} = await initWebGPU();

  // -- InitResurse -- //
  const { model, plane, texture, sampler } = await initResurse(device);
  // -- Просто вынес тест шейдеров в другой файл -- //
  const {shaderShadow, shader} = await getShaderCode();
  // -- Выделяем память под буферы и заполняем их данными Моделей 
  // -- Для Юниформ буфером просто выдяляем память
  const { uBiffers } = await initBuffers(device, model, plane);

  const { shadowPipelineGroup, pipelineMainGroup } = await initPipeline(
    device, canvas, format, uBiffers,
    shader, texture, sampler,shaderShadow) 
  
  //---create uniform data

    let MODELMATRIX = mat4.identity();
    let MODELMATRIX_PLANE = mat4.identity();
  
    let eyePosition = [0.0, 5.0, 8.0];
    let camera = new Camera(canvas);
    camera.setPosition(eyePosition);
    camera.setLook([0.0, -0.5, -1.0])

    let lightPosition = [10, 10, 10];
    let VIEWMATRIX_SHADOW = mat4.lookAt(lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    let PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);

    const depthRangeRemapMatrix = mat4.identity();
    depthRangeRemapMatrix[10] = -1;
    depthRangeRemapMatrix[14] = 1;

    const MATRIXGroup = {
      MODELMATRIX,
      MODELMATRIX_PLANE,
      VIEWMATRIX_SHADOW,
      PROJMATRIX_SHADOW,
      lightPosition,
      eyePosition,
      camera,
      depthRangeRemapMatrix
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

async function drawScene(state){


  const {device, context, format, size, canvas,
    uBiffers,shadowPipelineGroup, pipelineMainGroup, 
    model, plane, MATRIXGroup} = state;

  // -- Загружаем данные в uniform буфферы перед рисованием
  // -- Не стал выность инициализацию в отдельный файл потому что ..
  // -- буду перезаписывать буфер в каждом кадре и хочу что бы все было рядом.

  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, MATRIXGroup.camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, MATRIXGroup.camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  //device.queue.writeBuffer(uBiffers.uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
  //device.queue.writeBuffer(uBiffers.uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

  MATRIXGroup.MODELMATRIX = mat4.translate(MATRIXGroup.MODELMATRIX, vec3.set(0,2.0,0));

  device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset
  device.queue.writeBuffer(uBiffers.uniformBufferModel_2, 0, MATRIXGroup.MODELMATRIX_PLANE); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(MATRIXGroup.camera.eye));
  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, new Float32Array(MATRIXGroup.lightPosition));

  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0,  MATRIXGroup.PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64,  MATRIXGroup.VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)

  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined,
        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 }, 
        loadOp: 'clear',
        storeOp: "store", 
      },],
    depthStencilAttachment: {
      view: pipelineMainGroup.depthView,  // "Обычная" текстура глубины
      depthClearValue: 0.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  const renderPassDescriptionShadow = {
    colorAttachments: [],
    depthStencilAttachment: {
      view: shadowPipelineGroup.depthView, // текстура глубины для формирования теней
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  };


  // Animation   
  let time_old = 0;
  async function renderLoop(time) {

    //-----------------TIME-----------------------------
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------
    MATRIXGroup.camera.setDeltaTime(dt);

    //------------------MATRIX EDIT---------------------
    MATRIXGroup.MODELMATRIX = mat4.rotateY( MATRIXGroup.MODELMATRIX, dt * 0.0002);
    // MATRIXGroup.MODELMATRIX = mat4.rotateX(  MATRIXGroup.MODELMATRIX, dt * 0.0005);
    // MATRIXGroup.MODELMATRIX = mat4.rotateZ(  MATRIXGroup.MODELMATRIX, dt * 0.0003);
  
    const reversZpMatrix = mat4.multiply( MATRIXGroup.depthRangeRemapMatrix,MATRIXGroup.camera.pMatrix);
    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64,  MATRIXGroup.camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  
    device.queue.writeBuffer(uBiffers.uniformBufferModel, 0,  MATRIXGroup.MODELMATRIX); // и так дале прибавляем 64 к offset
   
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array( MATRIXGroup.camera.eye));
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, new Float32Array( MATRIXGroup.lightPosition));

    MATRIXGroup.VIEWMATRIX_SHADOW = mat4.lookAt(MATRIXGroup.lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, MATRIXGroup.PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64,  MATRIXGroup.VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
    //--------------------------------------------------
   
    const commandEncoder = device.createCommandEncoder();

    // SHADOW
    // Первым renderPass рендерим сцену с точки зрения источника света
    // Получиную текстуры глубины. shadowDepthView использыем в следуюшем renderPass для рисования тени.

    const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
    renderPassShadow.setPipeline(shadowPipelineGroup.pipeline);
    renderPassShadow.setVertexBuffer(0, model.vertexBuffer);
    renderPassShadow.setVertexBuffer(1, model.uvBuffer);
    renderPassShadow.setVertexBuffer(2, model.normalBuffer);
    renderPassShadow.setIndexBuffer(model.indexBuffer, "uint32");
    renderPassShadow.setBindGroup(0, shadowPipelineGroup.bindGroup.shadowGroup0);
    renderPassShadow.setBindGroup(1, shadowPipelineGroup.bindGroup.shadowGroup1);
    renderPassShadow.drawIndexed(model.index.length);

    renderPassShadow.setVertexBuffer(0, plane.plane_vertexBuffer);
    renderPassShadow.setVertexBuffer(1, plane.plane_uvBuffer);
    renderPassShadow.setVertexBuffer(2, plane.plane_normalBuffer);
    renderPassShadow.setIndexBuffer(plane.plane_indexBuffer, "uint32");
    renderPassShadow.setBindGroup(0, shadowPipelineGroup.bindGroup.shadowGroup0);
    renderPassShadow.setBindGroup(1, shadowPipelineGroup.bindGroup.shadowGroup2);
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
    renderPass.setIndexBuffer(model.indexBuffer, "uint32");
    renderPass.setBindGroup(0, pipelineMainGroup.bindGroup.uniformBindGroup0);
    renderPass.setBindGroup(1, pipelineMainGroup.bindGroup.uniformBindGroup1);
    renderPass.setBindGroup(2, pipelineMainGroup.bindGroup.uniformBindGroup2);
    renderPass.drawIndexed(model.index.length);

    renderPass.setVertexBuffer(0,  plane.plane_vertexBuffer);
    renderPass.setVertexBuffer(1,  plane.plane_uvBuffer);
    renderPass.setVertexBuffer(2,  plane.plane_normalBuffer);
    renderPass.setIndexBuffer( plane.plane_indexBuffer, "uint32");
    renderPass.setBindGroup(0, pipelineMainGroup.bindGroup.uniformBindGroup0);
    renderPass.setBindGroup(1, pipelineMainGroup.bindGroup.uniformBindGroup1);
    renderPass.setBindGroup(2, pipelineMainGroup.bindGroup.uniformBindGroup2_1);
    renderPass.drawIndexed(plane.index.length);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(renderLoop);
  };
  renderLoop(0);

}

async function main() {

   const state = {
    device : null,
    context : null,
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