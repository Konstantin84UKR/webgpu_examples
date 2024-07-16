export async function initPipeline( scene, shader) {
  
    //-------------------------------------------------------------------------------------------------------
  
    const computeLayout = scene.device.createBindGroupLayout({
      label: 'computeLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "read-only-storage",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "storage",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        },
      ],
    });
  
    const bindGroupCompute_A = scene.device.createBindGroup({
      label: 'bindGroupCompute_A',
      layout: computeLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: scene.UNIFORM.SIM.workBuffer_A
          }  
        },
        {
          binding: 1,
          resource: {
            buffer: scene.UNIFORM.SIM.workBuffer_B
          }  
        },
        {
          binding: 2,
          resource: {
            buffer: scene.UNIFORM.SIM.bufferUniform 
          }  
        }
      ]
    });

    const bindGroupCompute_B = scene.device.createBindGroup({
        label: 'bindGroupCompute_B',
        layout: computeLayout,
        entries: [
            {
                binding: 0,
                resource: {
                  buffer: scene.UNIFORM.SIM.workBuffer_B
                }  
              },
              {
                binding: 1,
                resource: {
                  buffer: scene.UNIFORM.SIM.workBuffer_A
                }  
              },
              {
                binding: 2,
                resource: {
                  buffer: scene.UNIFORM.SIM.bufferUniform 
                }  
              }
        ]
      });
  
  
    const pipeline = scene.device.createComputePipeline({
        label: 'compute pipeline',
        layout:  scene.device.createPipelineLayout({
            label: 'bindGroupComputeLayouts',
            bindGroupLayouts: [computeLayout]}),
        compute: {
            module: scene.device.createShaderModule({
            code: shader }),
            entryPoint: "computeSomething"
        },
    });

    const bindGroupsCompute = [
        {
            bindGroup: bindGroupCompute_A,
            buffer: scene.UNIFORM.SIM.workBuffer_B,
            
        },
        {
            bindGroup: bindGroupCompute_B,
            buffer: scene.UNIFORM.SIM.workBuffer_A,
            
        }];
       
  
    //computeLayout.BindGroup = {bindGroupCompute_A,bindGroupCompute_B};

    pipeline.layout = {computeLayout}
    pipeline.bindGroupsCompute = bindGroupsCompute;
  
    return {pipeline};
  }