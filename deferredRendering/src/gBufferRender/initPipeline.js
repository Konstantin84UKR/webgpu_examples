export async function initPipeline(device, canvas, format, uBiffers, shader, texture, sampler,shaderDeferredRendering) {
  
    // gBufferPipeline
    const layout_0_main = device.createBindGroupLayout({
      label: 'layout_0_main ',
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
      }     
    ]
    });
  
    const uniformBindGroup = device.createBindGroup({
      label: 'uniformBindGroup ',
      layout: layout_0_main,
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
        }      
      ]
    });
  
    const layout_1_ModelMatrix = device.createBindGroupLayout({
      label: 'bindGroupLayout_ModelMatrix ',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform'
        }
      }]
    });
    
    //plane Model#1
    const uniformBindGroupModel1 = device.createBindGroup({
      label: 'bindGroupLayout_ModelMatrix ',
      layout: layout_1_ModelMatrix,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBufferModel,
            offset: 0,
            size: 64  //  Model Matrix;   
          }
        }
      ]
    });
  
    //bunny Model#2
    const uniformBindGroupModel2 = device.createBindGroup({
      label: 'uniformBindGroupModel2 ',
      layout: layout_1_ModelMatrix,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBufferModel_2,
            offset: 0,
            size: 64  // Model Matrix;   
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
      label: 'depthTexture_gBufferTexture',
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
      bindGroupLayouts: [layout_0_main, layout_1_ModelMatrix]
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
     
    layout_0_main.BindGroup = {uniformBindGroup};
    layout_1_ModelMatrix.BindGroup = {uniformBindGroupModel1,uniformBindGroupModel2};

    pipeline.layout = {
      layout_0_main,
      layout_1_ModelMatrix      
    };
    
    pipeline.Depth = { depthTexture };
  
    pipeline.gBufferTexture = gBufferTexture;
   
    return {pipeline};
  }