export async function initBindGroup(device, uBiffers) {
   const uBindGroup = {};
   
    ///////////COMPUTE/////////////////////////////////////////////
    
    ///////  Layout   ////
    const computeBindGroupLayoutWorldBoundary = device.createBindGroupLayout({
        label: 'computeBindGroupLayoutWorldBoundary ',
        entries: [
            //PositionA
            { 
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" }
            },
             //PositionB
            { 
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" }
            } ,
             //Velocity
            { 
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage"}
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
   
    const bindGroupsComputeWorldBoundary_A = device.createBindGroup({
        label: 'bindGroupsComputeWorldBoundary_A',
        layout: computeBindGroupLayoutWorldBoundary,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_A } },
            { binding: 1, resource: { buffer: uBiffers.position_B } },
            //Velocity
            { binding: 2, resource: { buffer: uBiffers.velocity_A } }
                     
         ],
    });

        const bindGroupsComputeWorldBoundary_B = device.createBindGroup({
        label: 'bindGroupsComputeWorldBoundary_B',
        layout: computeBindGroupLayoutWorldBoundary,
        entries: [
            //Position
            { binding: 0, resource: { buffer: uBiffers.position_B } },
            { binding: 1, resource: { buffer: uBiffers.position_A } },
            //Velocity
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
            bindGroup: bindGroupsComputeWorldBoundary_A,
            buffer: uBiffers.position_B          
        },
        {
            bindGroup: bindGroupsComputeWorldBoundary_B,
            buffer: uBiffers.position_A         
        }];

    uBindGroup.bindGroupsCompute = bindGroupsCompute;
    uBindGroup.bindGroupUniform = bindGroupUniform;

    uBindGroup.layout = {
        computeBindGroupLayoutWorldBoundary,
        computeBindGroupLayoutUniform       
    };

     uBindGroup.layoutArr = [
        computeBindGroupLayoutWorldBoundary,
        computeBindGroupLayoutUniform
     ];
        


    return { uBindGroup };
}