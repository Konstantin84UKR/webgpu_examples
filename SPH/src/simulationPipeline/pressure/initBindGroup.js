export async function initBindGroup(device, uBiffers) {
   const uBindGroup = {};
   
    ///////////COMPUTE/////////////////////////////////////////////
    
    ///////  Layout   ////
    const computeBindGroupLayoutPressure = device.createBindGroupLayout({
        label: 'computeBindGroupLayoutPressure ',
        entries: [
            //Position
            { 
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
             //Position
            { 
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
            
            //Density
            { 
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            //Near Density
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            //Pressure
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            },
             //Near Pressure
            {
                binding: 5,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            }
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
   
    const bindGroupsComputePressure_B = device.createBindGroup({
        label: 'bindGroup for work buffer B',
        layout: computeBindGroupLayoutPressure,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_B } },
            { binding: 1, resource: { buffer: uBiffers.position_A } },
            //Density
            { binding: 2, resource: { buffer: uBiffers.density } },
            //Near Density
            { binding: 3, resource: { buffer: uBiffers.nearDensity } },
            //Pressure
            { binding: 4, resource: { buffer: uBiffers.pressure } },
            //Near Pressure
            { binding: 5, resource: { buffer: uBiffers.nearPressure } },
         ],
    });

        const bindGroupsComputePressure_A = device.createBindGroup({
        label: 'bindGroup for work buffer A',
        layout: computeBindGroupLayoutPressure,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_A } },
            { binding: 1, resource: { buffer: uBiffers.position_B } },
            //Density
            { binding: 2, resource: { buffer: uBiffers.density } },
            //Near Density
            { binding: 3, resource: { buffer: uBiffers.nearDensity } },
            //Pressure
            { binding: 4, resource: { buffer: uBiffers.pressure } },
            //Near Pressure
            { binding: 5, resource: { buffer: uBiffers.nearPressure } },
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
            bindGroup: bindGroupsComputePressure_A,
            buffer: uBiffers.position_A          
        },
        {
            bindGroup: bindGroupsComputePressure_B,
            buffer: uBiffers.position_B         
        }];

    uBindGroup.bindGroupsComputePressure = bindGroupsCompute;
    uBindGroup.bindGroupUniform = bindGroupUniform;

    uBindGroup.layout = {
        computeBindGroupLayoutPressure,
        computeBindGroupLayoutUniform       
    };

    uBindGroup.layoutArr = [
        uBindGroup.layout.computeBindGroupLayoutPressure,
        uBindGroup.layout.computeBindGroupLayoutUniform
    ];


    return { uBindGroup };
}