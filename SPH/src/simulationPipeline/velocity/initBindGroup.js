export async function initBindGroup(device, uBiffers) {
   const uBindGroup = {};
   
    ///////////COMPUTE/////////////////////////////////////////////
    
    ///////  Layout   ////
    const computeBindGroupLayoutVelocity = device.createBindGroupLayout({
        label: 'computeBindGroupLayoutVelocity ',
        entries: [
            //Position
            { 
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
             //PositionPrev
            { 
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
            
            //Velocity
            { 
                binding: 2,
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
   
    const bindGroupsComputeVelocity_A = device.createBindGroup({
        label: 'bindGroupsComputeVelocity_A',
        layout: computeBindGroupLayoutVelocity,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_A } },
            { binding: 1, resource: { buffer: uBiffers.previousPosition_A } },
            //velocity
            { binding: 2, resource: { buffer: uBiffers.velocity_A } }           
         ],
    });

        const bindGroupsComputeVelocity_B = device.createBindGroup({
        label: 'bindGroup for bindGroupsComputeVelocity_B buffer B',
        layout: computeBindGroupLayoutVelocity,
        entries: [
             //Position
            { binding: 0, resource: { buffer: uBiffers.position_B } },
            { binding: 1, resource: { buffer: uBiffers.previousPosition_A } },
            //velocity
            { binding: 2, resource: { buffer: uBiffers.velocity_A } }    
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
            bindGroup: bindGroupsComputeVelocity_A,
            buffer: uBiffers.position_A          
        },
        {
            bindGroup: bindGroupsComputeVelocity_B,
            buffer: uBiffers.position_B         
        }];

    uBindGroup.bindGroupsComputeVelocity = bindGroupsCompute;
    uBindGroup.bindGroupUniform = bindGroupUniform;

    uBindGroup.layout = {
        computeBindGroupLayoutVelocity,
        computeBindGroupLayoutUniform       
    };

    uBindGroup.layoutArr = [
        uBindGroup.layout.computeBindGroupLayoutVelocity, 
        uBindGroup.layout.computeBindGroupLayoutUniform       
    ];


    return { uBindGroup };
}