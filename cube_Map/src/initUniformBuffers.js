export async function initUniformBuffers(device) {
       
        const uBuffers = {};

        const uniformBuffer = device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });  

        uBuffers.uniformBuffer = uniformBuffer;

        return {uBuffers}
}

