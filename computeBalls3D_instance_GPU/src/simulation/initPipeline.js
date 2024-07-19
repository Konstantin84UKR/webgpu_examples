export async function initPipeline( scene, shader) {
  
    //-------------------------------------------------------------------------------------------------------
  
    scene.LAYOUT.computeLayout = scene.device.createBindGroupLayout({
      label: 'computeLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX,
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
      layout: scene.LAYOUT.computeLayout,
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
        layout: scene.LAYOUT.computeLayout,
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

    
      scene.LAYOUT.computeUniformLayout = scene.device.createBindGroupLayout({
        label: 'computeUniformLayout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {},
          },
        ],
      });
      
    const bindGroupUniform = scene.device.createBindGroup({
        label: 'bindGroupUniform',
        layout: scene.LAYOUT.computeUniformLayout,
        entries: [
              {
                binding: 0,
                resource: {
                  buffer: scene.UNIFORM.SIM.bufferUniform 
                }  
              }
            ]
    });  

    scene.LAYOUT.computeCurrentBallLayout = scene.device.createBindGroupLayout({
      label: 'computeCurrentBallLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        }]
    });

    const bindGroupCurrentBall = scene.device.createBindGroup({
      label: 'bindGroupCurrentBall',
      layout: scene.LAYOUT.computeCurrentBallLayout,
      entries: [
            {
              binding: 0,
              resource: {
                buffer: scene.UNIFORM.SIM.bufferCurrentBall 
              }  
            }
          ]
    });  
  
    const pipeline = scene.device.createComputePipeline({
        label: 'compute pipeline',
        layout:  scene.device.createPipelineLayout({
            label: 'bindGroupComputeLayouts',
            bindGroupLayouts: [scene.LAYOUT.computeLayout, scene.LAYOUT.computeUniformLayout,scene.LAYOUT.computeCurrentBallLayout]}),
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
            
        },
        {
            bindGroupUniform: bindGroupUniform,
            buffer: scene.UNIFORM.SIM.bufferUniform,          
        }];
       
  
    //computeLayout.BindGroup = {bindGroupCompute_A,bindGroupCompute_B};

    // scene.LAYOUT = {computeLayout,computeUniformLayout,computeCurrentBallLayout}
    
    pipeline.bindGroupsCompute = bindGroupsCompute;
    pipeline.BINDGROUP = {};
    pipeline.BINDGROUP.bindGroupCurrentBall = bindGroupCurrentBall;
         
    return {pipeline};
  }