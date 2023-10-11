export async function initPostEffectPipeline(device,format,postEffectShader,sampler,textures){
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: postEffectShader.vertex
            }),
            entryPoint: "vertex_main"
        },
        fragment: {
            module: device.createShaderModule({
                code: postEffectShader.fragment
            }),
            entryPoint: "fragment_main",
            targets: [{
                format: format
            }]
        },
        primitive: {
            topology: "triangle-list", // что будем рисовать точки - треугольники - линии
        }
    });


    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: textures[0].createView(), //  textureImage // textures[0]
            }
        ]
    });
    pipeline.BindGroup = {} 
    pipeline.BindGroup.bindGroup = bindGroup;

    return {pipeline}
}