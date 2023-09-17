export async function initUniformBuffers(device){
   
    const uniformBuffer = device.createBuffer({
        size: 64 + 64 + 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 

   const uBuffers = {uniformBuffer}
   
   return {uBuffers};
}