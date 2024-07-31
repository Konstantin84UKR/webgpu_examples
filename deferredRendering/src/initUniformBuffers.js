import { LIGTH_COUNT } from './settings.js';

export async function initUniformBuffers(device) {
  
    const uBiffers = {};
    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
      size: 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBuffer = uniformBuffer;
  
    const fragmentUniformBuffer = device.createBuffer({
      size: 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    uBiffers.fragmentUniformBuffer = fragmentUniformBuffer;
  
    const fragmentUniformBuffer1 = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    uBiffers.fragmentUniformBuffer1 = fragmentUniformBuffer1;
  
    const uniformBuffershadow = device.createBuffer({
      size: 64 + 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBuffershadow = uniformBuffershadow;
  
    const uniformBufferModel = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferModel = uniformBufferModel;
  
    const uniformBufferModel_2 = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferModel_2 = uniformBufferModel_2;
  
    const uniformBufferCamera = device.createBuffer({
      size: 64 * 2,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferCamera = uniformBufferCamera;

        // create uniform buffer and layout
    const ligthHelper_uniformBuffer = device.createBuffer({
          size: 64 + 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.ligthHelper_uniformBuffer = ligthHelper_uniformBuffer;


    const fragmentUniformLightPositionBuffer = device.createBuffer({
      size: 16 * LIGTH_COUNT ,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.fragmentUniformLightPositionBuffer = fragmentUniformLightPositionBuffer;

    const fragmentUniformLightColorBuffer = device.createBuffer({
      size: 16 * LIGTH_COUNT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.fragmentUniformLightColorBuffer = fragmentUniformLightColorBuffer;

    const instanceBuffer = device.createBuffer({
      label : "instanceBuffer",
      size : 64 * LIGTH_COUNT, // три Light
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    uBiffers.instanceBuffer = instanceBuffer;

    const instanceColorBuffer = device.createBuffer({
      label : "instanceBuffer",
      size : 16 * LIGTH_COUNT, // три Light
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    uBiffers.instanceColorBuffer = instanceColorBuffer;
  
    return { uBiffers };
  }