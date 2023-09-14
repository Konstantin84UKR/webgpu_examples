export async function initPostEffect(device, canvas, format, shaderPostEffect, texturePostEffect, sampler) {
    //   ***********************************************
    //   *************** _PostEffect *******************
    //   ***********************************************
  
    const gBufferTexturesBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            //sampleType: 'depth',
          },
        },
      ],
    });
  
    //   // Создаем саму текстуру
    //   const texturePostEffect = device.createTexture({
    //     size: [canvas.width, canvas.height],
    //     format: format,
    //     usage: GPUTextureUsage.TEXTURE_BINDING |
    //         GPUTextureUsage.COPY_DST |
    //         GPUTextureUsage.RENDER_ATTACHMENT
    //  });
  
    const pipeline_PostEffect = device.createRenderPipeline({
      label: "pipeline_PostEffect",
      layout: device.createPipelineLayout({
        bindGroupLayouts: [gBufferTexturesBindGroupLayout],
      }),
      vertex: {
        module: device.createShaderModule({
          code: shaderPostEffect.vertex
        }),
        entryPoint: "vertex_main"
      },
      fragment: {
        module: device.createShaderModule({
          code: shaderPostEffect.fragment
        }),
        entryPoint: "fragment_main",
        targets: [{
          format: format
        }
      ]
      },
      primitive: {
        topology: "triangle-list", // что будем рисовать точки - треугольники - линии
      },
      depthStencil: {
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
        depthWriteEnabled: false, //вкл\выкл теста глубины 
        depthCompare: 'always' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        //depthCompare: 'never' //'less' // greater 'never' //'less' // greater //greater-equal //less-equal "always"
      }
    });
  
  
    const bindGroup_PostEffect = device.createBindGroup({
      layout: gBufferTexturesBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: texturePostEffect.createView(),
        }
      ]
    });
  
    pipeline_PostEffect.BindGroup = {};
    pipeline_PostEffect.BindGroup.bindGroup_PostEffect = bindGroup_PostEffect;
  
    return { pipeline_PostEffect };
  
  }