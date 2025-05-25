export async function initBindGroup(device, uBiffers) {
    const uBindGroup = {};

    const renderBindGroupLayout = device.createBindGroupLayout({
        label: 'renderBindGroupLayout ',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "read-only-storage"
                }
            }
        ],
    });

    const bindGroupRender_A = device.createBindGroup({
        label: 'bindGroupRender_A',
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: uBiffers.position_B } },
        ],
    });

    const bindGroupRender_B = device.createBindGroup({
        label: 'bindGroupRender_B',
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: uBiffers.position_A } },
        ],
    });


    const renderBindGroupLayout_Uniform = device.createBindGroupLayout({
        label: 'renderBindGroupLayout_Uniform ',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform" }
            }
        ],
    });

    const bindGroupRender_Uniform = device.createBindGroup({
        label: 'bindGroupRender_Uniform',
        layout: renderBindGroupLayout_Uniform,
        entries: [
            { binding: 0, resource: { buffer: uBiffers.bufferUniform_render } },
        ],
    });

    // ////////COMPUTE/////////////////////////////////////////////
    const computeBindGroupLayout = device.createBindGroupLayout({
        label: 'computeBindGroupLayout ',
        entries: [
            //Position
            { 
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
            // //Previous position
            // {
            //     binding: 2,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "read-only-storage" }
            // },
            // {
            //     binding: 3,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "storage" }
            // },
            //Velocity
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
            // //Density
            // {
            //     binding: 6,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "read-only-storage" }
            // },
            // {
            //     binding: 7,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "storage" }
            // },
            // //Near density
            // {
            //     binding: 8,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "read-only-storage" }
            // },
            // {
            //     binding: 9,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "storage" }
            // },
            // //Pressure
            // {
            //     binding: 10,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "read-only-storage" }
            // },
            // {
            //     binding: 11,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "storage" }
            // },
            // //Near pressure
            // {
            //     binding: 12,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "read-only-storage" }
            // },
            // {
            //     binding: 13,
            //     visibility: GPUShaderStage.COMPUTE,
            //     buffer: { type: "storage" }
            // }
        ],
    });

    const computeBindGroupLayoutUniform = device.createBindGroupLayout({
        label: 'computeBindGroupLayoutUniform',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" }
            }
        ],
    });


    // const bindGroupCompute_A = device.createBindGroup({
    //     label: 'bindGroup for work buffer A',
    //     layout: computeBindGroupLayout,
    //     entries: [
    //         //Position
    //         { binding: 0, resource: { buffer: uBiffers.position_A } },
    //         { binding: 1, resource: { buffer: uBiffers.position_B } },
    //         // //Previous position
    //         // { binding: 2, resource: { buffer: uBiffers.previousPosition_A } },
    //         // { binding: 3, resource: { buffer: uBiffers.previousPosition_B } },  
    //         //Velocity
    //         // { binding: 2, resource: { buffer: uBiffers.velocity_A } },
    //         // { binding: 3, resource: { buffer: uBiffers.velocity_B } },
    //         // //Density
    //         // { binding: 6, resource: { buffer: uBiffers.position_A } },
    //         // { binding: 7, resource: { buffer: uBiffers.position_B } },  
          
    //         // //Near density
    //         // { binding: 8, resource: { buffer: uBiffers.position_A } },
    //         // { binding: 9, resource: { buffer: uBiffers.position_B } },
    //         // //Pressure
    //         // { binding: 10, resource: { buffer: uBiffers.position_A } },
    //         // { binding: 11, resource: { buffer: uBiffers.position_B } }, 
    //         // //Near pressure
    //         // { binding: 12, resource: { buffer: uBiffers.position_A } },
    //         // { binding: 13, resource: { buffer: uBiffers.position_B } }  
  
    //     ],
    // });

    // // Setup a bindGroup to tell the shader which
    // // buffer to use for the computation
    // const bindGroupCompute_B = device.createBindGroup({
    //     label: 'bindGroup for work buffer B',
    //     layout: computeBindGroupLayout,
    //     entries: [
    //         //Position
    //         { binding: 0, resource: { buffer: uBiffers.position_B } },
    //         { binding: 1, resource: { buffer: uBiffers.position_A } },  
    //         //Previous position
    //         // { binding: 2, resource: { buffer: uBiffers.previousPosition_B } },
    //         // { binding: 3, resource: { buffer: uBiffers.previousPosition_A } },   
    //         // // //Velocity
    //         // { binding: 2, resource: { buffer: uBiffers.position_B } },
    //         // { binding: 3, resource: { buffer: uBiffers.position_A } },   
    //         // //Density
    //         // { binding: 6, resource: { buffer: uBiffers.position_B } },
    //         // { binding: 7, resource: { buffer: uBiffers.position_A } },   
            
    //         // //Near density
    //         // { binding: 8, resource: { buffer: uBiffers.position_B } },
    //         // { binding: 9, resource: { buffer: uBiffers.position_A } },   
    //         // //Pressure
    //         // { binding: 10, resource: { buffer: uBiffers.position_B } },
    //         // { binding: 11, resource: { buffer: uBiffers.position_A } },   
    //         // //Near pressure
    //         // { binding: 12, resource: { buffer: uBiffers.position_B } },
    //         // { binding: 13, resource: { buffer: uBiffers.position_A } }            
    //     ],
    // });

    const bindGroupUniform = device.createBindGroup({
        label: 'bindGroupUniform',
        layout: computeBindGroupLayoutUniform,
        entries: [
            { binding: 0, resource: { buffer: uBiffers.bufferUniform } },
        ],
    });


    // const bindGroupsCompute = [
    //     {
    //         bindGroup: bindGroupCompute_A,
    //         buffer: uBiffers.position_B,
    //         bindGroupRender: bindGroupRender_A,
    //     },
    //     {
    //         bindGroup: bindGroupCompute_B,
    //         buffer: uBiffers.position_A,
    //         bindGroupRender: bindGroupRender_B
    //     }];


   // uBindGroup.bindGroupsCompute = bindGroupsCompute;
    uBindGroup.bindGroupRender_Uniform = bindGroupRender_Uniform;
    uBindGroup.bindGroupUniform = bindGroupUniform;
    uBindGroup.bindGroupRender_A = bindGroupRender_A;

    uBindGroup.layout = {
        renderBindGroupLayout,
        //computeBindGroupLayout,
        renderBindGroupLayout_Uniform,
        //computeBindGroupLayoutUniform
    };


    return { uBindGroup };
}