export async function initUniformBuffers(device){

    const uBuffers = {};

    const buffer0 = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(buffer0.getMappedRange())[0] = 0;
    buffer0.unmap();


    const buffer1 = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(buffer1.getMappedRange())[0] = 1;
    buffer1.unmap();

    const inputTime = new Float32Array([1.0]); 
    const bufferUniform = device.createBuffer({
        label: 'buffer Position',
        size: inputTime.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    bufferUniform.data = inputTime;


    uBuffers.buffer0 = buffer0;
    uBuffers.buffer1 = buffer1;
    uBuffers.bufferUniform = bufferUniform;

    return {uBuffers}
}