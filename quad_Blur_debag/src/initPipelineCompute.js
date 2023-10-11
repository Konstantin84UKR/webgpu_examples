export async function initPipelineCompute(device,computeShader,sampler,blurParamsBuffer,uBuffers,textureImage,textures){



    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: 'auto',
        compute: {
            module: device.createShaderModule({
                label: 'compute module',
                code: computeShader.compute}),
            entryPoint: 'computeSomething',
        },
    });

    const computeConstants = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(1),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: {
                    buffer: blurParamsBuffer,
                },
            },
        ],
    });

    const computeBindGroup0 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textureImage.createView(),
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: uBuffers.buffer0,
                },
            }
        ],
    });

    const computeBindGroup1 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textures[0].createView(),
            },
            {
                binding: 2,
                resource: textures[1].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: uBuffers.buffer1,
                },
            }
        ],
    });

    const computeBindGroup2 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textures[1].createView(),
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: uBuffers.buffer0,
                },
            }
        ],
    });

    pipelineCompute.BindGroup = {};
    pipelineCompute.BindGroup.computeConstants = computeConstants;

    pipelineCompute.BindGroup.computeBindGroup0 = computeBindGroup0;
    pipelineCompute.BindGroup.computeBindGroup1 = computeBindGroup1;
    pipelineCompute.BindGroup.computeBindGroup2 = computeBindGroup2;

    return {pipelineCompute}
}