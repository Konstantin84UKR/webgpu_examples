export async function initBindGroup(device, uBiffers) {
   const uBindGroup = {};
   
    ///////////COMPUTE/////////////////////////////////////////////
    
    ///////  Layout   ////
    const computeBindGroupLayoutDensity = device.createBindGroupLayout({
        label: 'computeBindGroupLayoutDensity ',
        entries: [
            //Position
            { 
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            //Density
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
            //Previous position
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
             //velocity
            { 
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
             //PositionB
            { 
                binding: 5,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
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
   
    ///////  BindGroup   ////
   
    const bindGroupCompute_A = device.createBindGroup({
        label: 'bindGroup for work buffer A',
        layout: computeBindGroupLayoutDensity,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_A } },
            //{ binding: 1, resource: { buffer: uBiffers.position_B } },
            //Density
            { binding: 1, resource: { buffer: uBiffers.density } },
            //Near density
            { binding: 2, resource: { buffer: uBiffers.nearDensity } },
            //Previous position
            { binding: 3, resource: { buffer: uBiffers.previousPosition_A } },
            //velocity
            { binding: 4, resource: { buffer: uBiffers.velocity_A } },
            //Position
            { binding: 5, resource: { buffer: uBiffers.position_B } },
         ],
    });

    // // Setup a bindGroup to tell the shader which
    // // buffer to use for the computation
    const bindGroupCompute_B = device.createBindGroup({
        label: 'bindGroup for work buffer B',
        layout: computeBindGroupLayoutDensity,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_B } },
          //  { binding: 1, resource: { buffer: uBiffers.position_A } },  
            //Density
             { binding: 1, resource: { buffer: uBiffers.density } },
            //Near density
             { binding: 2, resource: { buffer: uBiffers.nearDensity }},  
             //Previous position
            { binding: 3, resource: { buffer: uBiffers.previousPosition_A } },   
             //velocity
            { binding: 4, resource: { buffer: uBiffers.velocity_A } },
            //Position
            { binding: 5, resource: { buffer: uBiffers.position_A } },         
        ],
    });

    const bindGroupUniform = device.createBindGroup({
        label: 'bindGroupUniform',
        layout: computeBindGroupLayoutUniform,
        entries: [
            { binding: 0, resource: { buffer: uBiffers.bufferUniform } },
        ],
    });


    const bindGroupsCompute = [
        {
            bindGroup: bindGroupCompute_A,
            buffer: uBiffers.position_B          
        },
        {
            bindGroup: bindGroupCompute_B,
            buffer: uBiffers.position_A         
        }];


    uBindGroup.bindGroupsComputeDensity = bindGroupsCompute;
    uBindGroup.bindGroupUniform = bindGroupUniform;
   

    uBindGroup.layout = {
        computeBindGroupLayoutDensity,
        computeBindGroupLayoutUniform
    };

    uBindGroup.layoutArr = [
        uBindGroup.layout.computeBindGroupLayoutDensity,
        uBindGroup.layout.computeBindGroupLayoutUniform        
    ];

   


    return { uBindGroup };
}