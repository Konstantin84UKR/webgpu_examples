export async function initUniformBuffers(device,instance_count) {
  
    // create uniform buffer and layout
    const uniformBufferMatrix = device.createBuffer({
        label : "uniformBuffer",
        size: 64 + 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });  
  
    const instanceBuffer = device.createBuffer({
      label : "instanceBuffer",
      size :  (64) * instance_count,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const instanceNormalBuffer = device.createBuffer({
      label : "instanceNormalBuffer",
      size :  (64) * instance_count,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const uniformBufferInversMatrix = device.createBuffer({
        label : "uniformBufferInversMatrix",
        size: 64 + 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });  

    const uniformCommon = device.createBuffer({
        label : "uniformCommon",
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 

    const instanceBufferPosition = device.createBuffer({
        label : "instanceBufferPosition",
        size: 16 * instance_count,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }); 

    const instanceBufferRadius = device.createBuffer({
        label : "instanceBufferRadius",
        size: 4 * instance_count,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }); 

    const innstanceBufferCount = device.createBuffer({
        label : "innstanceBufferCount",
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 


    const uBuffers = {
        uniformBufferMatrix,
        instanceBuffer,
        instanceNormalBuffer,
        uniformBufferInversMatrix,
        uniformCommon,
        instanceBufferPosition,
        instanceBufferRadius,
        innstanceBufferCount
    }      
 
    return {uBuffers};
}