import { RADIUS , INSTANS_COUNT } from './settings.js';
import { vec4 } from './wgpu-matrix.module.js';
export async function createUniformData(scene){

    // create uniform buffer and layout
  scene.UNIFORM.uniformBufferCamera = scene.device.createBuffer({
    size: 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  scene.UNIFORM.uniformBufferBall = scene.device.createBuffer({
    label : "uniformBufferBall",
    size: (64 + 16) * INSTANS_COUNT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  scene.UNIFORM.uniformBuffer_Plane = scene.device.createBuffer({
    label : "uniformBuffer_Plane",
    size: (64 + 16), // 16 offset
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });

  //-------------------- TEXTURE ---------------------

  scene.UNIFORM.sampler = scene.device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: "nearest", //nearest
    addressModeU: 'repeat',
    addressModeV: 'repeat'
  });

  scene.UNIFORM.texture = scene.device.createTexture({
    size: [scene.asset.imageBitmap.width, scene.asset.imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  scene.device.queue.copyExternalImageToTexture(
    { source: scene.asset.imageBitmap },
    { texture: scene.UNIFORM.texture },
    [scene.asset.imageBitmap.width, scene.asset.imageBitmap.height]);


 
  
}

export async function updateUniformBuffer(scene,camera){
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  scene.device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  scene.device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  scene.device.queue.writeBuffer(scene.UNIFORM.uniformBufferBall, 0, scene.model.Sphere1.MODELMATRIX_ARRAY); // и так дале прибавляем 64 к offset
  scene.device.queue.writeBuffer(scene.UNIFORM.uniformBuffer_Plane, 0, scene.model.Plane1.MODELMATRIX); // и так дале прибавляем 64 к offset
  scene.device.queue.writeBuffer(scene.UNIFORM.uniformBuffer_Plane, 64, vec4.set(1.0,1.0,1.0,1.0)); // и так дале прибавляем 64 к offset
  
}

