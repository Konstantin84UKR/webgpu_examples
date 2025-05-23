export async function initPipeline(device, canvas, format, uBiffers, shader, texture, sampler,shaderDeferredRendering) {
    
  // gBufferPipeline  
    //--Layout--
    const bindGroupLayout_0_pipeline = device.createBindGroupLayout({
      label: 'bindGroupLayout_0_pipeline ',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      }, {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }, {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      }, {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {}
      }, {
        binding: 4,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      }]
    });
   //--BindGroup
    const uniformBindGroup = device.createBindGroup({
      //layout: pipeline.getBindGroupLayout(0),
      label: 'uniformBindGroup ',
      layout: bindGroupLayout_0_pipeline,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBuffer,
            offset: 0,
            size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
        },
        {
          binding: 1,
          resource: sampler
        },
        {
          binding: 2,
          resource: texture.createView()
        },
        {
          binding: 3,
          resource: {
            buffer: uBiffers.fragmentUniformBuffer,
            offset: 0,
            size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
          }
        },
        {
          binding: 4,
          resource: {
            buffer: uBiffers.uniformBuffershadow,
            offset: 0,
            size: 64 + 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX + + MODELMATRIX_PLANE// Каждая матрица занимает 64 байта
          }
        }
      ]
    });
   //--Layout--
    const bindGroupLayout_2_pipeline = device.createBindGroupLayout({
      label: 'bindGroupLayout_2_pipeline ',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform'
        }
      }]
    });
   //--BindGroup
    const uniformBindGroup2 = device.createBindGroup({
      label: 'uniformBindGroup2 ',
      //layout: pipeline.getBindGroupLayout(1),
      layout: bindGroupLayout_2_pipeline,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBufferModel,
            offset: 0,
            size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
          }
        }
      ]
    });
   //--BindGroup
    const uniformBindGroup2_1 = device.createBindGroup({
      label: 'uniformBindGroup2_1 ',
      //layout: pipeline.getBindGroupLayout(1),
      layout: bindGroupLayout_2_pipeline,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBufferModel_2,
            offset: 0,
            size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
          }
        }
      ]
    });
  
    // GBuffer texture render targets
    const gBufferTexture2DFloat16 = device.createTexture({
      size: [canvas.width, canvas.height],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'rgba16float',
    });

    const gBufferTextureAlbedo = device.createTexture({
      size: [canvas.width, canvas.height],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'bgra8unorm',  // 'bgra8unorm'
    });
   
    // Эта теневая текстура для обычного теста глубины при рендере сцены.
    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    
    const gBufferTexture = [
      gBufferTexture2DFloat16,
      gBufferTextureAlbedo,
      depthTexture,
    ];
  
    const pipelineLayout_pipeline = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout_0_pipeline, bindGroupLayout_2_pipeline]
    });
  
    const pipeline = device.createRenderPipeline({
      label: 'pipeline ',
      layout: pipelineLayout_pipeline,
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{
              shaderLocation: 0,
              format: "float32x3",
              offset: 0
            }]
          },
          {
            arrayStride: 8,
            attributes: [{
              shaderLocation: 1,
              format: "float32x2",
              offset: 0
            }]
          },
          {
            arrayStride: 12,
            attributes: [{
              shaderLocation: 2,
              format: "float32x3",
              offset: 0
            }]
          }
        ]
      },
      fragment: {
        module: device.createShaderModule({
          code: shader.fragment,
        }),
        entryPoint: "main",
        targets: [
        {
          format: format,
        },
        {
          format: 'rgba16float',
        }
        //,
        // {
        //   format: format,
        // }
        ],
      },
      primitive: {
       topology: "triangle-list",
       //topology: "point-list",
       //topology: "line-list",
      },
      depthStencil: {
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: 'greater' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        //depthCompare: 'never' //'less' // greater
      }
    });
  
   
  
    pipeline.BindGroup = {
      bindGroupLayout_0_pipeline,
      uniformBindGroup,
      bindGroupLayout_2_pipeline,
      uniformBindGroup2,
      uniformBindGroup2_1,
      pipelineLayout_pipeline
    };
  
  
    pipeline.Depth = { depthTexture };
  
    pipeline.gBufferTexture = gBufferTexture;
   
    return {pipeline};
  }