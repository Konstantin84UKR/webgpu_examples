
export async function initUniformBuffers(device) {
  
    const uBiffers = {};
  
    // create uniform buffer and layout
    uBiffers.uniformBuffer_CUBEMAP = device.createBuffer({
        label: 'uniformBuffer_CUBEMAP',
        size: 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    
    // create uniform buffer and layout
    uBiffers.uniformBuffer = device.createBuffer({
      label: 'uniformBuffer',
      size: 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    
    uBiffers.fragmentUniformBuffer = device.createBuffer({
      label: 'fragmentUniformBuffer',
      size: 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    uBiffers.uniformBuffershadow = device.createBuffer({
      label: 'uniformBuffershadow',
      size: 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
     
    return { uBiffers };
  }