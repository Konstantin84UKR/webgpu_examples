export async function initPipeline(device, canvas, format, uBiffers, gBufferTexture,shaderDeferredRendering) {
  
    //-------------------------------------------------------------------------------------------------------
  
    const gBufferTexturesBindGroupLayout = device.createBindGroupLayout({
      label: 'gBufferTexturesBindGroupLayout ',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'unfilterable-float',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'unfilterable-float',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth',
          },
        },
      ],
    });
  
    const gBufferTexturesBindGroup = device.createBindGroup({
      label: 'gBufferTexturesBindGroup ',
      layout: gBufferTexturesBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: gBufferTexture[0].createView() // normal
        },
        {
          binding: 1,
          resource: gBufferTexture[1].createView() // albedo
        },
        {
          binding: 2,
          resource: gBufferTexture[2].createView() // depth
        }
      ]
    });

    //SSAO

    // const SSAOTexturesBindGroupLayout = device.createBindGroupLayout({
    //   label: 'SSAOTexturesBindGroupLayout',
    //   entries: [
    //     {
    //       binding: 0,
    //       visibility: GPUShaderStage.FRAGMENT,
    //       texture: {
    //         sampleType: 'unfilterable-float',
    //       },
    //     }
    //   ],
    // });

    // const SSAOTexturesBindGroup = device.createBindGroup({
    //   label: 'SSAOTexturesBindGroup ',
    //   layout: SSAOTexturesBindGroupLayout,
    //   entries: [
    //     {
    //       binding: 0,
    //       resource: gBufferTexture[0].createView() // normal
    //     }
    //   ]
    // });

      const SSAOKernelBindGroupLayout = device.createBindGroupLayout({
      label: 'SSAOKernelBindGroupLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage"
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage"
          },
        }
      ],
    });

    const SSAOKernelBindGroup = device.createBindGroup({
      label: 'SSAOKernelBindGroup',
      layout: SSAOKernelBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.ssaoKernel,
            offset: 0,
            size: 16 * 64 
          }
        },
        {
          binding: 1,
          resource: {
            buffer: uBiffers.ssaoKernel,
            offset: 0,
            size: 16 * 16 
          }
        }
      ]
    });
    
    
    const gBufferUniformBindGroupLayout = device.createBindGroupLayout({
      entries: [
         {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {}
        },{
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {}
        },{
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {}
        }
      ],
    });


    //Uniform  
    const gBufferUniformBindGroup = device.createBindGroup({
      label: 'gBufferTexturesBindGroup ',
      layout: gBufferUniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.fragmentUniformBuffer,
            offset: 0,
            size: 32 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
          }
        },
        {
          binding: 1,
          resource: {
            buffer: uBiffers.fragmentUniformLightPositionBuffer,
            offset: 0,          
            size: 16 + 16 + 16 //   lightPosition : array<vec3<f32>, 3>;   
          }
        },
        {
          binding: 2,
          resource: {
            buffer: uBiffers.fragmentUniformLightColorBuffer,
            offset: 0,          
            size: 16 + 16 + 16 //   lightPosition : array<vec3<f32>, 3>;   
          }
        }
      ]
    });
  
  
    const gBufferCameraBindGroupLayout = device.createBindGroupLayout({
      label: 'gBufferCameraBindGroupLayout',
      entries: [
         {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {}
        },
      ],
    });
  
  
    const gBufferCameraBindGroup = device.createBindGroup({
      label: 'gBufferCameraBindGroup',
      layout: gBufferCameraBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBufferCamera,
            offset: 0,
            size: 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
        }
      ]
    });
    
  
    const pipeline = device.createRenderPipeline({
      label: 'pipeline2 ',
      layout: device.createPipelineLayout({
        label: 'gBuffer bindGroupLayouts ',
        bindGroupLayouts: [
          gBufferTexturesBindGroupLayout,
          gBufferUniformBindGroupLayout,
          gBufferCameraBindGroupLayout,
          SSAOKernelBindGroupLayout],
          
      }),
      vertex: {
        module: device.createShaderModule({
          code: shaderDeferredRendering.vertex
        }),
        entryPoint: "main"
      },
      fragment: {
        module: device.createShaderModule({
          code: shaderDeferredRendering.fragment
        }),
        entryPoint: "main",
        targets: [{
          format: format
        },
        {
          format: format, //SSAO
        }]
      },
      primitive: {
        topology: "triangle-list", // что будем рисовать точки - треугольники - линии
      },
      // depthStencil: {
      //   format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
      //   depthWriteEnabled: true, //вкл\выкл теста глубины 
      //   depthCompare: 'less' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
      //   //depthCompare: 'never' //'less' // greater
      // }
    });
  
    pipeline.BindGroup = {
      gBufferTexturesBindGroup,
      gBufferUniformBindGroup,
      gBufferCameraBindGroup,
      SSAOKernelBindGroup
    }
  
      // Эта теневая текстура для обычного теста глубины при рендере сцены.
      const depthTexture2 = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
  
      pipeline.depthTexture = depthTexture2;
  
    return { pipeline};
  }